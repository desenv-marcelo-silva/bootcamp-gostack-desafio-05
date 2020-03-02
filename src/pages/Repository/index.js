import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

import api from '../../services/api';
import Container from '../../components/Container';
import { Loading, Owner, FilterIssue, IssueList, Pagination } from './styles';

export default class Repository extends Component {
  static propTypes = {
    match: PropTypes.shape({
      params: PropTypes.shape({
        repository: PropTypes.string,
      }),
    }).isRequired,
  };

  state = {
    repository: {},
    issues: [],
    filterIssue: 'open',
    loading: true,
    actualPage: 1,
  };

  async componentDidMount() {
    const { match } = this.props;
    const { filterIssue } = this.state;

    const repoName = decodeURIComponent(match.params.repository);

    const [repository, issues] = await Promise.all([
      api.get(`/repos/${repoName}`),
      api.get(`/repos/${repoName}/issues`, {
        params: {
          state: filterIssue,
          per_page: 5,
        },
      }),
    ]);

    this.setState({
      repository: repository.data,
      issues: issues.data,
      loading: false,
    });
  }

  async componentDidUpdate(_, prevState) {
    const { match } = this.props;
    const { filterIssue } = this.state;
    const repoName = decodeURIComponent(match.params.repository);

    if (prevState.filterIssue !== filterIssue) {
      const issues = await api.get(`/repos/${repoName}/issues`, {
        params: {
          state: filterIssue,
          per_page: 5
        },
      });

      this.setState({ issues: issues.data });
    }
  }

  handleSelectChange = e => this.setState({ filterIssue: e.target.value });

  async getIssuesPage(newPage) {
    const { match } = this.props;
    const repoName = decodeURIComponent(match.params.repository);
    const { filterIssue } = this.state;

    const issues = await api.get(`/repos/${repoName}/issues`, {
      params: {
        state: filterIssue,
        per_page: 5,
        page: newPage,
      },
    });
    this.setState({ issues: issues.data, actualPage: newPage });
  }

  async handlePrevPageClick() {
    const { actualPage } = this.state;

    const newPage = actualPage-1 < 1 ? 1 : actualPage-1;

    this.getIssuesPage(newPage);
  }

  async handleNextPageClick() {
    const { actualPage } = this.state;

    const newPage = actualPage+1;
    
    this.getIssuesPage(newPage);
  }

  render() {
    const { repository, issues, loading } = this.state;

    if (loading) {
      return <Loading>Carregando...</Loading>;
    }

    return (
      <Container>
        <Owner>
          <Link to="/">Voltar aos repositórios</Link>
          <img src={repository.owner.avatar_url} alt={repository.owner.login} />
          <h1>{repository.name}</h1>
          <p>{repository.description}</p>
        </Owner>

        <span>Issue situation:</span>
        <FilterIssue onChange={this.handleSelectChange}>
          <option value="all">All</option>
          <option value="open" selected>Open</option>
          <option value="closed">Closed</option>
        </FilterIssue>

        <Pagination>
            <button type="button" onClick={() => this.handlePrevPageClick()}>Anterior</button>
            <button type="button" onClick={() => this.handleNextPageClick()}>Próximo</button>
        </Pagination>

        <IssueList>
          {issues.map(issue => (
            <li key={String(issue.id)}>
              <img src={issue.user.avatar_url} alt={issue.user.login} />
              <div>
                <strong>
                  <a href={issue.html_url}>{issue.title}</a>
                  {issue.labels.map(label => (
                    <span key={String(label.id)}>{label.name}</span>
                  ))}
                </strong>
                <p>{issue.user.login}</p>
              </div>
            </li>
          ))}
        </IssueList>
      </Container>
    );
  }
}

import React from 'react';
import { Button, Table } from 'semantic-ui-react'

/* 
props
    - fullMovies: list of full movie object from DB
    - srcMovies: list of movies to show
    - tarMovies: list of movies to ad

*/

class CandidateTable extends React.Component {    
    render() {
        return (
            // verticalAlign='middle'
            <div className="scrolling content" style={{overflow:'auto', maxHeight: this.props.height}}>
            <Table sortable compact celled definition textAlign="center">
                <Table.Header>
                    <Table.Row>
                        <Table.HeaderCell />
                        <Table.HeaderCell>Poster</Table.HeaderCell>
                        <Table.HeaderCell>Title</Table.HeaderCell>
                        <Table.HeaderCell>Genre</Table.HeaderCell>
                        <Table.HeaderCell>Date</Table.HeaderCell>
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                {this.props.candidateMovies.map(movie => {
                    return (
                        <Table.Row 
                          key={movie.id}
                          style={{cursor: 'pointer'}}
                          onClick={() => this.props.onMovieClick && this.props.onMovieClick(movie)}
                        >
                            <Table.Cell collapsing width="1" onClick={(e) => e.stopPropagation()}>
                            <Button 
                            inverted
                            active={this.props.candidateMovies.includes(movie)}
                            color='olive'
                            onClick={(e) => { e.stopPropagation(); this.props.onEvent(movie); }}
                            content='Add' />
                            </Table.Cell>
                            <Table.Cell width="1" style={{padding: '5px'}}>
                                {movie.poster ? (
                                    <img 
                                        src={movie.poster} 
                                        alt={movie.title}
                                        style={{
                                            width: '50px',
                                            height: '75px',
                                            objectFit: 'cover',
                                            borderRadius: '4px',
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                        }}
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                        }}
                                    />
                                ) : (
                                    <div style={{
                                        width: '50px',
                                        height: '75px',
                                        backgroundColor: '#f0f0f0',
                                        borderRadius: '4px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#999',
                                        fontSize: '10px'
                                    }}>No Image</div>
                                )}
                            </Table.Cell>
                            <Table.Cell width="5">{movie.title}</Table.Cell>
                            <Table.Cell width="3">{movie.genre}</Table.Cell>
                            <Table.Cell width="2">{movie.date}</Table.Cell>
                        </Table.Row>)
                })}
                </Table.Body>
            </Table>
            </div>
        );
    }
}
export default CandidateTable;
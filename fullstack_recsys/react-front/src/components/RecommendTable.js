import React from 'react';
import { Icon, Table, Message, Label } from 'semantic-ui-react'
import './TableStyles.css'

class RecommendTable extends React.Component {    
    render() {
        const { recommendMovies = [], height = '600px' } = this.props;
        
        // Debug logging only in development
        if (process.env.NODE_ENV === 'development') {
          console.log('RecommendTable render - recommendMovies:', recommendMovies);
          console.log('RecommendTable render - count:', recommendMovies?.length || 0);
        }
        
        if (!recommendMovies || recommendMovies.length === 0) {
            return (
                <Message info className="empty-recommendations">
                    <Message.Header>
                        <Icon name="info circle" />
                        No Recommendations Yet
                    </Message.Header>
                    <p>Select movies from the left panel and click the <strong>RECOMMEND</strong> button to get personalized recommendations!</p>
                </Message>
            );
        }
        
        return (
            <div className="scrolling content" style={{overflow:'auto', maxHeight: height}}>
            <Table sortable compact celled definition textAlign="center" className="recommendations-table">
                <Table.Header>
                    <Table.Row>
                        <Table.HeaderCell width="1">Rank</Table.HeaderCell>
                        <Table.HeaderCell width="1">Poster</Table.HeaderCell>
                        <Table.HeaderCell width="6">Title</Table.HeaderCell>
                        <Table.HeaderCell width="3">Genre</Table.HeaderCell>
                        <Table.HeaderCell width="2">Year</Table.HeaderCell>
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                {recommendMovies.map((movie, index) => {
                    return (
                        <Table.Row 
                          key={movie.id || index}
                          style={{cursor: 'pointer'}}
                          onClick={() => this.props.onMovieClick && this.props.onMovieClick(movie)}
                          className="recommendation-row"
                        >
                            <Table.Cell collapsing width="1" textAlign="center">
                                <Label circular color="orange" size="small">
                                    {index + 1}
                                </Label>
                            </Table.Cell>
                            <Table.Cell width="1" style={{padding: '8px'}}>
                                {movie.poster ? (
                                    <img 
                                        src={movie.poster} 
                                        alt={movie.title || 'Movie poster'}
                                        style={{
                                            width: '60px',
                                            height: '90px',
                                            objectFit: 'cover',
                                            borderRadius: '6px',
                                            boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
                                            transition: 'transform 0.2s ease'
                                        }}
                                        onError={(e) => {
                                            e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="60" height="90"%3E%3Crect fill="%23333" width="60" height="90"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999" font-size="10"%3ENo Image%3C/text%3E%3C/svg%3E';
                                        }}
                                    />
                                ) : (
                                    <div style={{
                                        width: '60px',
                                        height: '90px',
                                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                        borderRadius: '6px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#8b9dc3',
                                        fontSize: '10px',
                                        border: '1px dashed rgba(255, 255, 255, 0.2)'
                                    }}>No Image</div>
                                )}
                            </Table.Cell>
                            <Table.Cell width="6" style={{fontWeight: 500}}>
                                {movie.title || 'Unknown Title'}
                            </Table.Cell>
                            <Table.Cell width="3" style={{color: '#8b9dc3'}}>
                                {movie.genre || 'N/A'}
                            </Table.Cell>
                            <Table.Cell width="2" style={{color: '#8b9dc3'}}>
                                {movie.date || movie.year || 'N/A'}
                            </Table.Cell>
                        </Table.Row>)
                })}
                </Table.Body>
            </Table>
            </div>
        );
    }
}
export default RecommendTable;
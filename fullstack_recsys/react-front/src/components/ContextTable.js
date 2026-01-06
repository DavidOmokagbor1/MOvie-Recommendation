import React from 'react';
import { Button, Table } from 'semantic-ui-react'
import './TableStyles.css'

// Memoized row component for better performance
const ContextMovieRow = React.memo(({ movie, onEvent, onMovieClick }) => {
    const handleRowClick = React.useCallback(() => {
        onMovieClick && onMovieClick(movie);
    }, [movie, onMovieClick]);
    
    const handleButtonClick = React.useCallback((e) => {
        e.stopPropagation();
        onEvent(movie);
    }, [movie, onEvent]);
    
    return (
        <Table.Row 
            style={{cursor: 'pointer'}}
            onClick={handleRowClick}
        >
            <Table.Cell collapsing width="1" onClick={(e) => e.stopPropagation()}>
                <Button 
                    inverted
                    color='olive'
                    onClick={handleButtonClick}
                    content='Delete' 
                /> 
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
        </Table.Row>
    );
});

ContextMovieRow.displayName = 'ContextMovieRow';

class ContextTable extends React.Component {    
    render() {
        const { contextMovies, onEvent, onMovieClick, height } = this.props;
        
        return (
            <div className="scrolling content" style={{overflow:'auto', maxHeight: height}}>
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
                {contextMovies.map(movie => (
                    <ContextMovieRow
                        key={movie.id}
                        movie={movie}
                        onEvent={onEvent}
                        onMovieClick={onMovieClick}
                    />
                ))}
                </Table.Body>
            </Table>
            </div>
        );
    }
}
export default ContextTable;
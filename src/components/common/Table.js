//Tabla
import React from 'react';
import './Table.css';

const Table = ({ data, columns, title }) => {
    if (!data || data.length === 0) {
        return (
            <div className="empty-table-message">
                {title && <h4>{title}</h4>}
                <p>No hay datos para mostrar en esta tabla.</p>
            </div>
        );
    }

    return (
        <div className="table-responsive">
            {title && <h4 className="table-title">{title}</h4>}
            <table className="custom-table">
                {/* --- Encabezados de la Tabla --- */}
                <thead>
                <tr>
                    {columns.map((column, index) => (
                        <th key={index}>{column.header}</th>
                    ))}
                </tr>
                </thead>
                {/* --- Cuerpo de la Tabla --- */}
                <tbody>
                {data.map((item, rowIndex) => (
                    <tr key={rowIndex}>
                        {columns.map((column, colIndex) => (
                            <td key={colIndex}>
                                {column.render
                                    ? column.render(item, rowIndex)
                                    : item[column.accessor]
                                }
                            </td>
                        ))}
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
};

export default Table;
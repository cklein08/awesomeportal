import React from 'react';
import { useNavigate } from 'react-router-dom';
import GridEditForm from '../components/GridEditForm';
import { useGridEditor } from '../hooks/useGridEditor';
import { readPersonaFromLocation } from '../utils/config';
import './GridEdit.css';

const GridEdit: React.FC = () => {
    const navigate = useNavigate();
    const editor = useGridEditor(readPersonaFromLocation());

    return (
        <div className="grid-edit-page">
            <header className="grid-edit-header">
                <h1>Edit Grid (Admin)</h1>
                <div className="grid-edit-actions">
                    <button type="button" className="grid-edit-btn secondary" onClick={() => navigate('/')}>
                        Back to Grid
                    </button>
                    <button type="button" className="grid-edit-btn secondary" onClick={() => navigate('/admin/activities')}>
                        Admin activities
                    </button>
                </div>
            </header>
            <GridEditForm {...editor} showPersonaPicker />
        </div>
    );
};

export default GridEdit;

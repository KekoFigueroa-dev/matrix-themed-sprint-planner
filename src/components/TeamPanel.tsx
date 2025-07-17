
import React, { useState } from 'react';
import { TeamMember } from '../types';
import { Edit2, Plus, Trash2, X } from 'lucide-react';

interface TeamPanelProps {
  teamMembers: TeamMember[];
  addTeamMember: (name: string, role: string) => void;
  editTeamMember: (id: number, name: string, role: string) => void;
  deleteTeamMember: (id: number) => void;
}

const TeamPanel: React.FC<TeamPanelProps> = ({
  teamMembers,
  addTeamMember,
  editTeamMember,
  deleteTeamMember,
}) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [name, setName] = useState('');
  const [role, setRole] = useState('');

  const handleAddNew = () => {
    setEditingMember(null);
    setName('');
    setRole('');
    setIsFormOpen(true);
  };

  const handleEdit = (member: TeamMember) => {
    setEditingMember(member);
    setName(member.name);
    setRole(member.role);
    setIsFormOpen(true);
  };

  const handleCancel = () => {
    setIsFormOpen(false);
    setEditingMember(null);
    setName('');
    setRole('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && role.trim()) {
      if (editingMember) {
        editTeamMember(editingMember.id, name.trim(), role.trim());
      } else {
        addTeamMember(name.trim(), role.trim());
      }
      handleCancel();
    }
  };

  return (
    <div className="team-panel">
      <h2>Team Members</h2>
      <ul className="team-list">
        {teamMembers.map(member => (
          <li key={member.id} className="team-member-item">
            <div className="member-info">
              <span className="member-name">{member.name}</span>
              <span className="member-role">{member.role}</span>
            </div>
            <div className="member-actions">
              <button onClick={() => handleEdit(member)} title="Edit Member">
                <Edit2 size={16} />
              </button>
              <button 
                onClick={() => deleteTeamMember(member.id)} 
                title="Delete Member" 
                className="delete-action"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </li>
        ))}
         {!isFormOpen && (
            <button className="add-member-button" onClick={handleAddNew}>
                <Plus size={16} /> Add New Member
            </button>
        )}
      </ul>
     
      {isFormOpen && (
        <form onSubmit={handleSubmit} className="team-form">
          <h3>{editingMember ? 'Edit Member' : 'Add Member'}</h3>
          <input
            type="text"
            placeholder="Name..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Role..."
            value={role}
            onChange={(e) => setRole(e.target.value)}
            required
          />
          <div className="form-actions">
            <button type="submit" className="save-button">
              {editingMember ? 'Save Changes' : 'Add Member'}
            </button>
            <button type="button" onClick={handleCancel} className="cancel-button">
                Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default TeamPanel;
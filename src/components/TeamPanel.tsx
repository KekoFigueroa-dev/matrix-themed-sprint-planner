
import React, { useState } from 'react';
import { Edit2, X } from 'lucide-react';
import type { WorkspaceProfile } from '../lib/teamDb';
import type { WorkspaceRole } from '../lib/workspace';

interface TeamPanelProps {
  profiles: WorkspaceProfile[];
  currentUserId: string | null;
  workspaceRole: WorkspaceRole | null;
  onSaveDisplayName: (userId: string, displayName: string) => Promise<void>;
}

const TeamPanel: React.FC<TeamPanelProps> = ({
  profiles,
  currentUserId,
  workspaceRole,
  onSaveDisplayName,
}) => {
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  const canEdit = (userId: string) =>
    workspaceRole === 'admin' || userId === currentUserId;

  const handleEdit = (profile: WorkspaceProfile) => {
    if (!canEdit(profile.userId)) return;
    setEditingUserId(profile.userId);
    setName(profile.displayName);
  };

  const handleCancel = () => {
    setEditingUserId(null);
    setName('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUserId || !name.trim() || saving) return;
    setSaving(true);
    try {
      await onSaveDisplayName(editingUserId, name.trim());
      handleCancel();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="team-panel">
      <h2>Team</h2>
      <p className="team-panel-hint">
        Members join via invites. Edit display names for assignees.
      </p>
      <ul className="team-list">
        {profiles.map((profile) => (
          <li key={profile.userId} className="team-member-item">
            <div className="member-info">
              <span className="member-name">{profile.displayName}</span>
              <span className="member-role">{profile.role}</span>
            </div>
            {canEdit(profile.userId) && editingUserId !== profile.userId && (
              <div className="member-actions">
                <button
                  type="button"
                  onClick={() => handleEdit(profile)}
                  title="Edit display name"
                >
                  <Edit2 size={16} />
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>

      {editingUserId && (
        <form onSubmit={handleSubmit} className="team-form">
          <h3>Edit display name</h3>
          <input
            type="text"
            placeholder="Display name..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={80}
            autoFocus
          />
          <div className="form-actions">
            <button type="submit" className="save-button" disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button type="button" onClick={handleCancel} className="cancel-button">
              <X size={16} /> Cancel
            </button>
          </div>
          </form>
      )}
    </div>
  );
};

export default TeamPanel;

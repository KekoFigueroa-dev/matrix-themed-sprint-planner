
import React, { useState } from 'react';
import { Edit2 } from 'lucide-react';
import type { WorkspaceProfile } from '../lib/teamDb';
import type { WorkspaceRole } from '../lib/workspace';
import { Button, Input } from '../ui';

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
    <>
      <h2 className="planner-card__heading">Team</h2>
      <p className="planner-card__hint">
        Members join via invites. Edit display names for assignees.
      </p>
      <ul className="planner-team-list">
        {profiles.map((profile) => (
          <li key={profile.userId} className="planner-team-member">
            <div>
              <span className="planner-team-member__name">{profile.displayName}</span>
              <span className="planner-team-member__role">{profile.role}</span>
            </div>
            {canEdit(profile.userId) && editingUserId !== profile.userId && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => handleEdit(profile)}
                title="Edit display name"
                aria-label={`Edit ${profile.displayName}`}
              >
                <Edit2 size={16} />
              </Button>
            )}
          </li>
        ))}
      </ul>

      {editingUserId && (
        <form onSubmit={handleSubmit} className="planner-team-form">
          <Input
            label="Display name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={80}
            autoFocus
          />
          <div className="planner-team-form__actions">
            <Button type="submit" variant="primary" loading={saving}>
              Save
            </Button>
            <Button type="button" variant="secondary" onClick={handleCancel} disabled={saving}>
              Cancel
            </Button>
          </div>
        </form>
      )}
    </>
  );
};

export default TeamPanel;

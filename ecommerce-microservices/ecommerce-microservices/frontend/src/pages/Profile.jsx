import { useEffect, useState } from 'react';
import { api } from '../api/client';

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/users/me').then(({ data }) => setProfile(data.profile));
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    const { data } = await api.put('/users/me', { name: profile.name, phone: profile.phone });
    setProfile(data.profile);
    setSaving(false);
  }

  if (!profile) return <div className="container section">Loading profile...</div>;

  return (
    <div className="container section" style={{ maxWidth: 500 }}>
      <h1 className="page-title">Your profile</h1>
      <div className="card">
        <form onSubmit={handleSave}>
          <div className="form-group">
            <label>Name</label>
            <input value={profile.name || ''} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input value={profile.email || ''} disabled />
          </div>
          <div className="form-group">
            <label>Phone</label>
            <input value={profile.phone || ''} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
          </div>
          <button className="btn btn-primary" disabled={saving} type="submit">
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        </form>
      </div>
    </div>
  );
}

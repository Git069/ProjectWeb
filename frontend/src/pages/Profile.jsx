import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { userAPI } from '../services/api';
import CustomerProfileForm from '../components/CustomerProfileForm';
import CraftsmanProfileForm from '../components/CraftsmanProfileForm';

function TabPanel({ children, value, index }) {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

function Profile() {
  const navigate = useNavigate();
  const { user, isCustomer, isCraftsman, refreshUser } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setError('');
    setSuccess('');
  };

  const handleUserUpdate = async (userData) => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await userAPI.updateProfile(userData);
      setSuccess('Profil erfolgreich aktualisiert!');
      await refreshUser();
    } catch (err) {
      console.error('Failed to update profile:', err);
      setError(err.response?.data?.detail || 'Fehler beim Aktualisieren des Profils');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <Container>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Mein Profil</Typography>
        <Button variant="outlined" onClick={() => navigate('/dashboard')}>
          Zurück
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <Paper elevation={3} sx={{ p: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 2 }}>
          <Tab label="Benutzerdaten" />
          <Tab label={isCustomer() ? 'Kundenprofil' : 'Handwerkerprofil'} />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <Box component="form" onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            handleUserUpdate({
              first_name: formData.get('first_name'),
              last_name: formData.get('last_name'),
              email: formData.get('email'),
            });
          }}>
            <Typography variant="h6" gutterBottom>
              Persönliche Daten
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Benutzername: <strong>{user.username}</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Rolle: <strong>{isCustomer() ? 'Kunde' : 'Handwerker'}</strong>
              </Typography>
            </Box>
            {/* User form fields will be added by the form components */}
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {isCustomer() ? (
            <CustomerProfileForm
              profile={user.customer_profile}
              onSuccess={() => {
                setSuccess('Kundenprofil erfolgreich aktualisiert!');
                refreshUser();
              }}
              onError={(msg) => setError(msg)}
            />
          ) : (
            <CraftsmanProfileForm
              profile={user.craftsman_profile}
              onSuccess={() => {
                setSuccess('Handwerkerprofil erfolgreich aktualisiert!');
                refreshUser();
              }}
              onError={(msg) => setError(msg)}
            />
          )}
        </TabPanel>
      </Paper>
    </Container>
  );
}

export default Profile;

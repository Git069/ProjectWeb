import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
} from '@mui/material';
import axios from 'axios';

function CustomerProfileForm({ profile, onSuccess, onError }) {
  const [formData, setFormData] = useState({
    address: '',
    phone: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profile) {
      setFormData({
        address: profile.address || '',
        phone: profile.phone || '',
      });
    }
  }, [profile]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
      };

      if (profile) {
        // Update existing profile
        await axios.patch(
          `http://localhost:8000/api/customer-profiles/${profile.id}/`,
          formData,
          config
        );
      } else {
        // Create new profile
        await axios.post(
          'http://localhost:8000/api/customer-profiles/',
          formData,
          config
        );
      }

      onSuccess();
    } catch (err) {
      console.error('Failed to save customer profile:', err);
      onError(err.response?.data?.detail || 'Fehler beim Speichern des Profils');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Typography variant="h6" gutterBottom>
        Kundenprofil
      </Typography>

      <TextField
        margin="normal"
        fullWidth
        id="address"
        label="Adresse"
        name="address"
        multiline
        rows={2}
        value={formData.address}
        onChange={handleChange}
        disabled={loading}
        helperText="Ihre vollständige Adresse"
      />

      <TextField
        margin="normal"
        fullWidth
        id="phone"
        label="Telefonnummer"
        name="phone"
        value={formData.phone}
        onChange={handleChange}
        disabled={loading}
        helperText="Ihre Kontaktnummer"
      />

      <Button
        type="submit"
        variant="contained"
        sx={{ mt: 3 }}
        disabled={loading}
      >
        {loading ? 'Speichere...' : 'Profil speichern'}
      </Button>
    </Box>
  );
}

export default CustomerProfileForm;

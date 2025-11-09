import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import axios from 'axios';

function CraftsmanProfileForm({ profile, onSuccess, onError }) {
  const [formData, setFormData] = useState({
    company_name: '',
    trade: '',
    service_area_zip: '',
    is_verified: false,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profile) {
      setFormData({
        company_name: profile.company_name || '',
        trade: profile.trade || '',
        service_area_zip: profile.service_area_zip || '',
        is_verified: profile.is_verified || false,
      });
    }
  }, [profile]);

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value,
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
          `http://localhost:8000/api/craftsman-profiles/${profile.user}/`,
          formData,
          config
        );
      } else {
        // Create new profile
        await axios.post(
          'http://localhost:8000/api/craftsman-profiles/',
          formData,
          config
        );
      }

      onSuccess();
    } catch (err) {
      console.error('Failed to save craftsman profile:', err);
      onError(err.response?.data?.detail || 'Fehler beim Speichern des Profils');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Typography variant="h6" gutterBottom>
        Handwerkerprofil
      </Typography>

      <TextField
        margin="normal"
        fullWidth
        id="company_name"
        label="Firmenname"
        name="company_name"
        value={formData.company_name}
        onChange={handleChange}
        disabled={loading}
        helperText="Name Ihres Unternehmens (optional)"
      />

      <TextField
        margin="normal"
        required
        fullWidth
        id="trade"
        label="Gewerbe"
        name="trade"
        value={formData.trade}
        onChange={handleChange}
        disabled={loading}
        helperText="z.B. 'Elektriker', 'Klempner', 'Maler'"
      />

      <TextField
        margin="normal"
        required
        fullWidth
        id="service_area_zip"
        label="Servicebereich (PLZ)"
        name="service_area_zip"
        value={formData.service_area_zip}
        onChange={handleChange}
        disabled={loading}
        helperText="Postleitzahlen Ihres Servicebereichs (kommagetrennt, z.B. '10115,10117,10119')"
      />

      <FormControlLabel
        control={
          <Checkbox
            checked={formData.is_verified}
            onChange={handleChange}
            name="is_verified"
            disabled={true}
          />
        }
        label="Verifiziert (nur vom Administrator änderbar)"
        sx={{ mt: 2 }}
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

export default CraftsmanProfileForm;

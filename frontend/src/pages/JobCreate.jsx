import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
} from '@mui/material';
import { jobsAPI } from '../services/api';

function JobCreate() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    trade: '',
    zip_code: '',
    budget: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await jobsAPI.createJob(formData);
      navigate('/jobs');
    } catch (err) {
      console.error('Failed to create job:', err);
      setError(err.response?.data?.detail || 'Fehler beim Erstellen des Auftrags');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ padding: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">
            Neuen Auftrag erstellen
          </Typography>
          <Button variant="outlined" onClick={() => navigate('/dashboard')}>
            Zurück
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="title"
            label="Titel"
            name="title"
            autoFocus
            value={formData.title}
            onChange={handleChange}
            disabled={loading}
            helperText="z.B. 'Badezimmer renovieren'"
          />
          <TextField
            margin="normal"
            required
            fullWidth
            id="description"
            label="Beschreibung"
            name="description"
            multiline
            rows={4}
            value={formData.description}
            onChange={handleChange}
            disabled={loading}
            helperText="Beschreiben Sie den Auftrag im Detail"
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
            id="zip_code"
            label="Postleitzahl"
            name="zip_code"
            value={formData.zip_code}
            onChange={handleChange}
            disabled={loading}
            helperText="PLZ des Auftragsortes"
          />
          <TextField
            margin="normal"
            fullWidth
            id="budget"
            label="Budget (optional)"
            name="budget"
            type="number"
            value={formData.budget}
            onChange={handleChange}
            disabled={loading}
            helperText="Geschätztes Budget in EUR"
            inputProps={{ min: 0, step: 0.01 }}
          />
          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading}
            >
              {loading ? 'Erstelle...' : 'Auftrag erstellen'}
            </Button>
            <Button
              variant="outlined"
              fullWidth
              onClick={() => navigate('/dashboard')}
              disabled={loading}
            >
              Abbrechen
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
}

export default JobCreate;

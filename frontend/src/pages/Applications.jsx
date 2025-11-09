import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  Button,
  Divider,
} from '@mui/material';
import { CheckCircle, Cancel, HourglassEmpty } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { applicationsAPI } from '../services/api';

function Applications() {
  const navigate = useNavigate();
  const { isCustomer, isCraftsman } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const cardStyle = {
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
    transition: 'all 0.3s ease',
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: '0 12px 48px rgba(0, 0, 0, 0.15)',
    },
  };

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      const response = await applicationsAPI.getApplications();
      setApplications(response.data);
    } catch (err) {
      console.error('Failed to load applications:', err);
      setError('Fehler beim Laden der Bewerbungen');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'SUBMITTED':
        return <HourglassEmpty />;
      case 'ACCEPTED':
        return <CheckCircle />;
      case 'REJECTED':
        return <Cancel />;
      default:
        return null;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'SUBMITTED':
        return 'Eingereicht';
      case 'ACCEPTED':
        return 'Angenommen';
      case 'REJECTED':
        return 'Abgelehnt';
      default:
        return status;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'SUBMITTED':
        return 'warning';
      case 'ACCEPTED':
        return 'success';
      case 'REJECTED':
        return 'error';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ px: { xs: 2, sm: 3, md: 4, lg: 6 }, maxWidth: '100%' }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, color: '#1a1a1a' }}>
          {isCraftsman() ? 'Meine Bewerbungen 📝' : 'Bewerbungen für meine Aufträge 📬'}
        </Typography>
        <Typography variant="body1" sx={{ color: '#4a4a4a' }}>
          {isCraftsman()
            ? 'Übersicht über alle deine eingereichten Bewerbungen'
            : 'Übersicht über alle Bewerbungen für deine Aufträge'}
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {applications.length === 0 ? (
        <Card sx={cardStyle}>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <Typography variant="h6" color="text.secondary">
              {isCraftsman()
                ? 'Du hast noch keine Bewerbungen eingereicht.'
                : 'Es gibt noch keine Bewerbungen für deine Aufträge.'}
            </Typography>
            <Button
              variant="contained"
              sx={{ mt: 3 }}
              onClick={() => navigate('/jobs')}
            >
              {isCraftsman() ? 'Aufträge durchsuchen' : 'Neuen Auftrag erstellen'}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {applications.map((application) => (
            <Grid item xs={12} md={6} key={application.id}>
              <Card sx={cardStyle}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                    <Box>
                      <Typography variant="h6" gutterBottom>
                        {application.job_title || `Auftrag #${application.job}`}
                      </Typography>
                      {isCraftsman() ? (
                        <Typography variant="body2" color="text.secondary">
                          Auftrag-ID: {application.job}
                        </Typography>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          Handwerker: {application.craftsman_username}
                        </Typography>
                      )}
                    </Box>
                    <Chip
                      icon={getStatusIcon(application.status)}
                      label={getStatusLabel(application.status)}
                      color={getStatusColor(application.status)}
                      size="small"
                    />
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Nachricht:
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {application.message}
                  </Typography>

                  <Typography variant="caption" color="text.secondary">
                    Eingereicht am: {new Date(application.created_at).toLocaleDateString('de-DE')}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button
                    size="small"
                    onClick={() => navigate(`/jobs/${application.job}`)}
                  >
                    Auftrag anzeigen
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}

export default Applications;

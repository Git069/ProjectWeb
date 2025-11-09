import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Paper,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Grid,
  Card,
  CardContent,
  CardActions,
  TextField,
  Divider,
  Rating,
} from '@mui/material';
import { LocationOn, Work, Person, Euro, Star } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { jobsAPI, applicationsAPI, chatAPI } from '../services/api';

function JobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isCustomer, isCraftsman } = useAuth();

  const [job, setJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [applicationText, setApplicationText] = useState('');
  const [applyLoading, setApplyLoading] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);

  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewData, setReviewData] = useState({
    rating: 5,
    comment: '',
  });

  useEffect(() => {
    loadJobDetail();
  }, [id]);

  const loadJobDetail = async () => {
    try {
      const jobResponse = await jobsAPI.getJob(id);
      setJob(jobResponse.data);

      // Load applications and matches if customer
      if (isCustomer()) {
        // Load applications
        try {
          const appsData = await fetch(`http://localhost:8000/api/jobs/${id}/applications/`, {
            headers: {
              'Authorization': `Token ${localStorage.getItem('token')}`,
            },
          });
          if (appsData.ok) {
            const apps = await appsData.json();
            setApplications(apps);
          }
        } catch (e) {
          console.log('No applications endpoint or no applications yet');
        }

        // Load matching craftsmen
        try {
          const matchesResponse = await jobsAPI.getMatches(id);
          setMatches(matchesResponse.data);
        } catch (e) {
          console.log('Could not load matches');
        }
      }

      // Check if craftsman has already applied
      if (isCraftsman()) {
        const myApps = await applicationsAPI.getApplications();
        const alreadyApplied = myApps.data.some(app => app.job === parseInt(id));
        setHasApplied(alreadyApplied);
      }
    } catch (err) {
      console.error('Failed to load job:', err);
      setError('Fehler beim Laden des Auftrags');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!applicationText.trim()) {
      setError('Bitte geben Sie eine Bewerbungsnachricht ein');
      return;
    }

    setApplyLoading(true);
    setError('');

    try {
      // Use the job apply endpoint
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/api/jobs/${id}/apply/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: applicationText,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Fehler beim Bewerben');
      }

      setSuccess('Bewerbung erfolgreich eingereicht!');
      setHasApplied(true);
      setApplicationText('');
    } catch (err) {
      console.error('Failed to apply:', err);
      setError(err.message || 'Fehler beim Einreichen der Bewerbung');
    } finally {
      setApplyLoading(false);
    }
  };

  const handleAcceptApplication = async (applicationId) => {
    try {
      await applicationsAPI.acceptApplication(applicationId);
      setSuccess('Bewerbung angenommen!');
      loadJobDetail(); // Reload to update status
    } catch (err) {
      console.error('Failed to accept application:', err);
      setError(err.response?.data?.error || 'Fehler beim Annehmen der Bewerbung');
    }
  };

  const handleCompleteJob = async () => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:8000/api/jobs/${id}/complete/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
        },
      });
      setSuccess('Auftrag als abgeschlossen markiert! Jetzt kannst du eine Bewertung abgeben.');
      setShowReviewForm(true);
      loadJobDetail();
    } catch (err) {
      console.error('Failed to complete job:', err);
      setError('Fehler beim Abschließen des Auftrags');
    }
  };

  const handleSubmitReview = async () => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:8000/api/jobs/${id}/review/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reviewData),
      });
      setSuccess('Bewertung erfolgreich abgegeben!');
      setShowReviewForm(false);
      loadJobDetail();
    } catch (err) {
      console.error('Failed to submit review:', err);
      setError('Fehler beim Abgeben der Bewertung');
    }
  };

  const handleOpenChat = async (craftsmanId) => {
    try {
      const response = await chatAPI.getOrCreateChatRoom(parseInt(id), craftsmanId);
      navigate('/chat');
    } catch (err) {
      console.error('Failed to open chat:', err);
      setError('Fehler beim Öffnen des Chats');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'OPEN': return 'success';
      case 'IN_PROGRESS': return 'warning';
      case 'COMPLETED': return 'info';
      default: return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'OPEN': return 'Offen';
      case 'IN_PROGRESS': return 'In Bearbeitung';
      case 'COMPLETED': return 'Abgeschlossen';
      default: return status;
    }
  };

  const getApplicationStatusLabel = (status) => {
    switch (status) {
      case 'SUBMITTED': return 'Eingereicht';
      case 'ACCEPTED': return 'Angenommen';
      case 'REJECTED': return 'Abgelehnt';
      default: return status;
    }
  };

  const getApplicationStatusColor = (status) => {
    switch (status) {
      case 'SUBMITTED': return 'default';
      case 'ACCEPTED': return 'success';
      case 'REJECTED': return 'error';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Container>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (!job) {
    return (
      <Container>
        <Alert severity="error" sx={{ mt: 4 }}>
          Auftrag nicht gefunden
        </Alert>
        <Button onClick={() => navigate('/jobs')} sx={{ mt: 2 }}>
          Zurück zur Übersicht
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Auftragsdetails</Typography>
        <Button variant="outlined" onClick={() => navigate('/jobs')}>
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

      <Paper elevation={3} sx={{ p: 4, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 3 }}>
          <Typography variant="h5" component="h1">
            {job.title}
          </Typography>
          <Chip
            label={getStatusLabel(job.status)}
            color={getStatusColor(job.status)}
          />
        </Box>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Work sx={{ mr: 1, color: 'text.secondary' }} />
              <Typography variant="body2">
                <strong>Gewerbe:</strong> {job.trade}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <LocationOn sx={{ mr: 1, color: 'text.secondary' }} />
              <Typography variant="body2">
                <strong>PLZ:</strong> {job.zip_code}
              </Typography>
            </Box>
          </Grid>
          {job.budget && (
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Euro sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography variant="body2">
                  <strong>Budget:</strong> {job.budget} €
                </Typography>
              </Box>
            </Grid>
          )}
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Person sx={{ mr: 1, color: 'text.secondary' }} />
              <Typography variant="body2">
                <strong>Kunde:</strong> {job.customer_username}
              </Typography>
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ mb: 3 }} />

        <Typography variant="h6" gutterBottom>
          Beschreibung
        </Typography>
        <Typography variant="body1" paragraph>
          {job.description}
        </Typography>

        {job.assigned_craftsman_username && (
          <Box sx={{ mt: 3 }}>
            <Alert severity="info">
              Dieser Auftrag wurde an <strong>{job.assigned_craftsman_username}</strong> vergeben.
            </Alert>
          </Box>
        )}

        {/* Customer: Complete Job Button */}
        {isCustomer() && job.customer === user.id && job.status === 'IN_PROGRESS' && (
          <Box sx={{ mt: 3 }}>
            <Button
              variant="contained"
              color="success"
              onClick={handleCompleteJob}
            >
              ✅ Auftrag abschließen
            </Button>
          </Box>
        )}

        {/* Display existing review */}
        {job.review && (
          <Box sx={{ mt: 3, p: 3, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid #e0e0e0' }}>
            <Typography variant="h6" gutterBottom>
              ⭐ Bewertung
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Rating value={job.review.rating} readOnly />
              <Typography variant="body2" sx={{ ml: 1 }}>
                ({job.review.rating}/5)
              </Typography>
            </Box>
            <Typography variant="body1">{job.review.comment}</Typography>
          </Box>
        )}
      </Paper>

      {/* Customer: Review Form */}
      {isCustomer() && job.customer === user.id && job.status === 'COMPLETED' && !job.review && showReviewForm && (
        <Paper elevation={3} sx={{ p: 4, mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            ⭐ Bewerte den Handwerker
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Wie zufrieden warst du mit der Arbeit von {job.assigned_craftsman_username}?
          </Typography>

          <Box sx={{ mb: 3 }}>
            <Typography component="legend" gutterBottom>
              Bewertung
            </Typography>
            <Rating
              value={reviewData.rating}
              onChange={(event, newValue) => {
                setReviewData({ ...reviewData, rating: newValue });
              }}
              size="large"
            />
          </Box>

          <TextField
            fullWidth
            multiline
            rows={4}
            label="Kommentar"
            value={reviewData.comment}
            onChange={(e) => setReviewData({ ...reviewData, comment: e.target.value })}
            placeholder="Beschreibe deine Erfahrung mit diesem Handwerker..."
            sx={{ mb: 2 }}
          />

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              onClick={handleSubmitReview}
              disabled={!reviewData.rating}
            >
              Bewertung abgeben
            </Button>
            <Button
              variant="outlined"
              onClick={() => setShowReviewForm(false)}
            >
              Abbrechen
            </Button>
          </Box>
        </Paper>
      )}

      {/* Show review button if completed but no review yet */}
      {isCustomer() && job.customer === user.id && job.status === 'COMPLETED' && !job.review && !showReviewForm && (
        <Paper elevation={3} sx={{ p: 4, mt: 3, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            Bewerte diesen Auftrag
          </Typography>
          <Button
            variant="contained"
            startIcon={<Star />}
            onClick={() => setShowReviewForm(true)}
          >
            Bewertung abgeben
          </Button>
        </Paper>
      )}

      {/* Craftsman: Apply for Job */}
      {isCraftsman() && job.status === 'OPEN' && !hasApplied && (
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h6" gutterBottom>
            Auf diesen Auftrag bewerben
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Ihre Bewerbungsnachricht"
            value={applicationText}
            onChange={(e) => setApplicationText(e.target.value)}
            disabled={applyLoading}
            placeholder="Beschreiben Sie, warum Sie der richtige Handwerker für diesen Auftrag sind..."
            sx={{ mb: 2 }}
          />
          <Button
            variant="contained"
            onClick={handleApply}
            disabled={applyLoading || !applicationText.trim()}
          >
            {applyLoading ? 'Bewerbe...' : 'Jetzt bewerben'}
          </Button>
        </Paper>
      )}

      {isCraftsman() && hasApplied && (
        <Alert severity="success">
          Sie haben sich bereits auf diesen Auftrag beworben.
        </Alert>
      )}

      {/* Customer: View Applications */}
      {isCustomer() && job.customer === user.id && applications.length > 0 && (
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h6" gutterBottom>
            Bewerbungen ({applications.length})
          </Typography>
          <Grid container spacing={2}>
            {applications.map((app) => (
              <Grid item xs={12} key={app.id}>
                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                      <Typography variant="h6">
                        {app.craftsman_username}
                      </Typography>
                      <Chip
                        label={getApplicationStatusLabel(app.status)}
                        color={getApplicationStatusColor(app.status)}
                        size="small"
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {app.message}
                    </Typography>
                  </CardContent>
                  {app.status === 'SUBMITTED' && job.status === 'OPEN' && (
                    <CardActions>
                      <Button
                        size="small"
                        color="primary"
                        onClick={() => handleAcceptApplication(app.id)}
                      >
                        Annehmen
                      </Button>
                    </CardActions>
                  )}
                </Card>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}

      {/* Customer: Matching Craftsmen */}
      {isCustomer() && job.customer === user.id && matches.length > 0 && (
        <Paper elevation={3} sx={{ p: 4, mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            🎯 Passende Handwerker ({matches.length})
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Diese Handwerker passen zu deinem Auftrag basierend auf Gewerbe und PLZ
          </Typography>
          <Grid container spacing={2}>
            {matches.map((craftsman) => (
              <Grid item xs={12} sm={6} md={4} key={craftsman.id}>
                <Card variant="outlined" sx={{
                  transition: 'all 0.3s',
                  '&:hover': {
                    boxShadow: 3,
                    transform: 'translateY(-4px)',
                  }
                }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {craftsman.username}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {craftsman.email}
                    </Typography>
                    {craftsman.craftsman_profile && (
                      <Box sx={{ mt: 2 }}>
                        {craftsman.craftsman_profile.company_name && (
                          <Typography variant="body2">
                            <strong>Firma:</strong> {craftsman.craftsman_profile.company_name}
                          </Typography>
                        )}
                        <Typography variant="body2">
                          <strong>Gewerbe:</strong> {craftsman.craftsman_profile.trade}
                        </Typography>
                        {craftsman.craftsman_profile.is_verified && (
                          <Chip
                            label="✓ Verifiziert"
                            color="success"
                            size="small"
                            sx={{ mt: 1 }}
                          />
                        )}
                      </Box>
                    )}
                  </CardContent>
                  <CardActions>
                    <Button
                      size="small"
                      variant="contained"
                      onClick={() => handleOpenChat(craftsman.id)}
                    >
                      💬 Chat öffnen
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}
    </Container>
  );
}

export default JobDetail;

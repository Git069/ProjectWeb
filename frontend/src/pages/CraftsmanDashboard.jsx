import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Chip,
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Rating,
} from '@mui/material';
import {
  Work as WorkIcon,
  CheckCircle as CheckCircleIcon,
  AccessTime as AccessTimeIcon,
  TrendingUp as TrendingUpIcon,
  Search as SearchIcon,
  Star as StarIcon,
  Euro as EuroIcon,
  Assignment as AssignmentIcon,
} from '@mui/icons-material';
import { dashboardAPI, jobsAPI, applicationsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

function CraftsmanDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dashboardData, setDashboardData] = useState(null);
  const [availableJobs, setAvailableJobs] = useState([]);
  const [myApplications, setMyApplications] = useState([]);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const response = await dashboardAPI.getDashboard();
      setDashboardData(response.data);

      // Load available jobs
      const jobsResponse = await jobsAPI.getJobs();
      setAvailableJobs(jobsResponse.data.slice(0, 5));

      // Load my applications
      const appsResponse = await applicationsAPI.getApplications();
      setMyApplications(appsResponse.data.slice(0, 5));
    } catch (err) {
      console.error('Failed to load dashboard:', err);
      setError('Fehler beim Laden des Dashboards');
    } finally {
      setLoading(false);
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
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  const stats = dashboardData?.craftsman_dashboard || {};
  const profile = dashboardData?.user_info?.craftsman_profile;

  return (
    <Box sx={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      py: 4,
      px: { xs: 2, md: 4 }
    }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold', mb: 1 }}>
          Willkommen zurück, {user?.username}!
        </Typography>
        <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.9)' }}>
          Finde neue Aufträge und erweitere dein Geschäft
        </Typography>
      </Box>

      {/* Profile Card */}
      {profile && (
        <Card sx={{
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(10px)',
          mb: 4
        }}>
          <CardContent>
            <Grid container spacing={3} alignItems="center">
              <Grid item>
                <Avatar sx={{ width: 80, height: 80, bgcolor: '#f5576c', fontSize: '2rem' }}>
                  {user?.username?.charAt(0).toUpperCase()}
                </Avatar>
              </Grid>
              <Grid item xs>
                <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {profile.company_name || user?.username}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                  {profile.trade}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  {profile.is_verified && (
                    <Chip
                      icon={<CheckCircleIcon />}
                      label="Verifiziert"
                      color="success"
                      size="small"
                    />
                  )}
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Rating value={4.5} readOnly size="small" precision={0.5} />
                    <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                      (4.5)
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/profile')}
                >
                  Profil bearbeiten
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{
            background: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(10px)',
            transition: 'transform 0.3s',
            '&:hover': { transform: 'translateY(-8px)', boxShadow: 6 }
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#f5576c', mb: 1 }}>
                    {stats.total_applications || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Bewerbungen gesamt
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: '#f5576c', width: 56, height: 56 }}>
                  <AssignmentIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{
            background: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(10px)',
            transition: 'transform 0.3s',
            '&:hover': { transform: 'translateY(-8px)', boxShadow: 6 }
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#10b981', mb: 1 }}>
                    {stats.accepted_applications || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Angenommen
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: '#10b981', width: 56, height: 56 }}>
                  <CheckCircleIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{
            background: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(10px)',
            transition: 'transform 0.3s',
            '&:hover': { transform: 'translateY(-8px)', boxShadow: 6 }
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#f59e0b', mb: 1 }}>
                    {stats.open_market_jobs || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Verfügbare Jobs
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: '#f59e0b', width: 56, height: 56 }}>
                  <WorkIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{
            background: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(10px)',
            transition: 'transform 0.3s',
            '&:hover': { transform: 'translateY(-8px)', boxShadow: 6 }
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#667eea', mb: 1 }}>
                    4.5
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Durchschnittsbewertung
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: '#667eea', width: 56, height: 56 }}>
                  <StarIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Card sx={{
        background: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(10px)',
        mb: 4
      }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
            Schnellaktionen
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<SearchIcon />}
                onClick={() => navigate('/jobs')}
                sx={{
                  py: 2,
                  background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #e082ea 0%, #e4465b 100%)',
                  }
                }}
              >
                Jobs durchsuchen
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<AssignmentIcon />}
                onClick={() => navigate('/applications')}
                sx={{ py: 2 }}
              >
                Meine Bewerbungen
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<StarIcon />}
                onClick={() => navigate('/profile')}
                sx={{ py: 2 }}
              >
                Bewertungen
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<TrendingUpIcon />}
                onClick={() => navigate('/chat')}
                sx={{ py: 2 }}
              >
                Chat
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Available jobs and My Applications */}
      <Grid container spacing={3}>
        {/* Available jobs */}
        <Grid item xs={12} md={6}>
          <Card sx={{
            background: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(10px)',
            height: '100%'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Verfügbare Aufträge
                </Typography>
                <Button size="small" onClick={() => navigate('/jobs')}>
                  Alle anzeigen
                </Button>
              </Box>
              <Divider sx={{ mb: 2 }} />
              {availableJobs.length > 0 ? (
                <List>
                  {availableJobs.map((job, index) => (
                    <React.Fragment key={job.id}>
                      <ListItem
                        sx={{
                          cursor: 'pointer',
                          borderRadius: 1,
                          '&:hover': { bgcolor: 'rgba(245, 87, 108, 0.1)' }
                        }}
                        onClick={() => navigate(`/jobs/${job.id}`)}
                      >
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: '#f5576c' }}>
                            <WorkIcon />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={job.title}
                          secondary={
                            <Box>
                              <Typography variant="body2" component="span">
                                {job.trade} • PLZ {job.zip_code}
                              </Typography>
                              {job.budget && (
                                <Typography variant="body2" component="span" sx={{ ml: 1 }}>
                                  • {job.budget} €
                                </Typography>
                              )}
                            </Box>
                          }
                        />
                        <Chip
                          label="Bewerben"
                          color="success"
                          size="small"
                        />
                      </ListItem>
                      {index < availableJobs.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    Keine verfügbaren Aufträge in deinem Gewerbe
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<SearchIcon />}
                    onClick={() => navigate('/jobs')}
                    sx={{ mt: 2 }}
                  >
                    Alle Jobs durchsuchen
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* My Applications */}
        <Grid item xs={12} md={6}>
          <Card sx={{
            background: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(10px)',
            height: '100%'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Meine Bewerbungen
                </Typography>
                <Button size="small" onClick={() => navigate('/applications')}>
                  Alle anzeigen
                </Button>
              </Box>
              <Divider sx={{ mb: 2 }} />
              {myApplications.length > 0 ? (
                <List>
                  {myApplications.map((app, index) => (
                    <React.Fragment key={app.id}>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: getApplicationStatusColor(app.status) === 'success' ? '#10b981' : getApplicationStatusColor(app.status) === 'error' ? '#ef4444' : '#f093fb' }}>
                            <AssignmentIcon />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={app.job_title || 'Auftrag'}
                          secondary={`Status: ${getApplicationStatusLabel(app.status)}`}
                        />
                        <Chip
                          label={getApplicationStatusLabel(app.status)}
                          color={getApplicationStatusColor(app.status)}
                          size="small"
                        />
                      </ListItem>
                      {index < myApplications.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    Du hast noch keine Bewerbungen eingereicht
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<SearchIcon />}
                    onClick={() => navigate('/jobs')}
                    sx={{ mt: 2 }}
                  >
                    Jobs finden
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default CraftsmanDashboard;

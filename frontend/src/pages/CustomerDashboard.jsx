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
  LinearProgress,
  Avatar,
  Divider,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
} from '@mui/material';
import {
  Add as AddIcon,
  Work as WorkIcon,
  CheckCircle as CheckCircleIcon,
  AccessTime as AccessTimeIcon,
  TrendingUp as TrendingUpIcon,
  Person as PersonIcon,
  Euro as EuroIcon,
} from '@mui/icons-material';
import { dashboardAPI, jobsAPI, applicationsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

function CustomerDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dashboardData, setDashboardData] = useState(null);
  const [recentJobs, setRecentJobs] = useState([]);
  const [recentApplications, setRecentApplications] = useState([]);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const response = await dashboardAPI.getDashboard();
      setDashboardData(response.data);

      // Load recent jobs
      const jobsResponse = await jobsAPI.getJobs();
      setRecentJobs(jobsResponse.data.slice(0, 5));

      // Load recent applications
      const appsResponse = await applicationsAPI.getApplications();
      setRecentApplications(appsResponse.data.slice(0, 5));
    } catch (err) {
      console.error('Failed to load dashboard:', err);
      setError('Fehler beim Laden des Dashboards');
    } finally {
      setLoading(false);
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

  const stats = dashboardData?.customer_dashboard || {};

  return (
    <Box sx={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      py: 4,
      px: { xs: 2, md: 4 }
    }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold', mb: 1 }}>
          Willkommen zurück, {user?.username}!
        </Typography>
        <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.9)' }}>
          Verwalte deine Aufträge und finde den perfekten Handwerker
        </Typography>
      </Box>

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
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#667eea', mb: 1 }}>
                    {stats.total_jobs || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Aufträge gesamt
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: '#667eea', width: 56, height: 56 }}>
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
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#10b981', mb: 1 }}>
                    {stats.open_jobs || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Offene Aufträge
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: '#10b981', width: 56, height: 56 }}>
                  <AccessTimeIcon />
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
                    {stats.in_progress_jobs || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    In Bearbeitung
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: '#f59e0b', width: 56, height: 56 }}>
                  <TrendingUpIcon />
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
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#ef4444', mb: 1 }}>
                    {stats.new_applications || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Neue Bewerbungen
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: '#ef4444', width: 56, height: 56 }}>
                  <PersonIcon />
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
                startIcon={<AddIcon />}
                onClick={() => navigate('/jobs/new')}
                sx={{
                  py: 2,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #5568d3 0%, #66408e 100%)',
                  }
                }}
              >
                Neuer Auftrag
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<WorkIcon />}
                onClick={() => navigate('/jobs')}
                sx={{ py: 2 }}
              >
                Alle Aufträge
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<PersonIcon />}
                onClick={() => navigate('/applications')}
                sx={{ py: 2 }}
              >
                Bewerbungen
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<CheckCircleIcon />}
                onClick={() => navigate('/chat')}
                sx={{ py: 2 }}
              >
                Chat
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Recent Jobs and Applications */}
      <Grid container spacing={3}>
        {/* Recent Jobs */}
        <Grid item xs={12} md={6}>
          <Card sx={{
            background: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(10px)',
            height: '100%'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Aktuelle Aufträge
                </Typography>
                <Button size="small" onClick={() => navigate('/jobs')}>
                  Alle anzeigen
                </Button>
              </Box>
              <Divider sx={{ mb: 2 }} />
              {recentJobs.length > 0 ? (
                <List>
                  {recentJobs.map((job, index) => (
                    <React.Fragment key={job.id}>
                      <ListItem
                        sx={{
                          cursor: 'pointer',
                          borderRadius: 1,
                          '&:hover': { bgcolor: 'rgba(102, 126, 234, 0.1)' }
                        }}
                        onClick={() => navigate(`/jobs/${job.id}`)}
                      >
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: getStatusColor(job.status) === 'success' ? '#10b981' : getStatusColor(job.status) === 'warning' ? '#f59e0b' : '#667eea' }}>
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
                            </Box>
                          }
                        />
                        <Chip
                          label={getStatusLabel(job.status)}
                          color={getStatusColor(job.status)}
                          size="small"
                        />
                      </ListItem>
                      {index < recentJobs.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    Keine Aufträge vorhanden
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => navigate('/jobs/new')}
                    sx={{ mt: 2 }}
                  >
                    Ersten Auftrag erstellen
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Applications */}
        <Grid item xs={12} md={6}>
          <Card sx={{
            background: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(10px)',
            height: '100%'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Aktuelle Bewerbungen
                </Typography>
                <Button size="small" onClick={() => navigate('/applications')}>
                  Alle anzeigen
                </Button>
              </Box>
              <Divider sx={{ mb: 2 }} />
              {recentApplications.length > 0 ? (
                <List>
                  {recentApplications.map((app, index) => (
                    <React.Fragment key={app.id}>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: '#764ba2' }}>
                            <PersonIcon />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={app.craftsman_username}
                          secondary={`Für: ${app.job_title || 'Auftrag'}`}
                        />
                        <Chip
                          label={app.status === 'SUBMITTED' ? 'Neu' : app.status === 'ACCEPTED' ? 'Angenommen' : 'Abgelehnt'}
                          color={app.status === 'SUBMITTED' ? 'default' : app.status === 'ACCEPTED' ? 'success' : 'error'}
                          size="small"
                        />
                      </ListItem>
                      {index < recentApplications.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    Keine Bewerbungen vorhanden
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default CustomerDashboard;

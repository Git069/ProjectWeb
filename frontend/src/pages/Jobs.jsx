import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
  Paper,
} from '@mui/material';
import { Add as AddIcon, LocationOn, Work, Search as SearchIcon } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { jobsAPI } from '../services/api';

function Jobs() {
  const navigate = useNavigate();
  const { isCustomer } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTrade, setFilterTrade] = useState('');
  const [filterZip, setFilterZip] = useState('');

  useEffect(() => {
    loadJobs();
  }, []);

  useEffect(() => {
    filterJobs();
  }, [searchTerm, filterTrade, filterZip, jobs]);

  const loadJobs = async () => {
    try {
      const response = await jobsAPI.getJobs();
      setJobs(response.data);
      setFilteredJobs(response.data);
    } catch (err) {
      console.error('Failed to load jobs:', err);
      setError('Fehler beim Laden der Aufträge');
    } finally {
      setLoading(false);
    }
  };

  const filterJobs = () => {
    let filtered = jobs;

    // Search in title and description
    if (searchTerm) {
      filtered = filtered.filter(job =>
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by trade
    if (filterTrade) {
      filtered = filtered.filter(job =>
        job.trade.toLowerCase().includes(filterTrade.toLowerCase())
      );
    }

    // Filter by zip code
    if (filterZip) {
      filtered = filtered.filter(job =>
        job.zip_code.includes(filterZip)
      );
    }

    setFilteredJobs(filtered);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'OPEN':
        return 'success';
      case 'IN_PROGRESS':
        return 'warning';
      case 'COMPLETED':
        return 'info';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'OPEN':
        return 'Offen';
      case 'IN_PROGRESS':
        return 'In Bearbeitung';
      case 'COMPLETED':
        return 'Abgeschlossen';
      default:
        return status;
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

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          {isCustomer() ? 'Meine Aufträge' : 'Verfügbare Aufträge'}
        </Typography>
        {isCustomer() && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/jobs/create')}
          >
            Neuer Auftrag
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Search and Filter */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          🔍 Suchen & Filtern
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Suche nach Titel oder Beschreibung..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              placeholder="Gewerbe (z.B. Elektriker)"
              value={filterTrade}
              onChange={(e) => setFilterTrade(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Work fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              placeholder="PLZ"
              value={filterZip}
              onChange={(e) => setFilterZip(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LocationOn fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
        </Grid>
        {(searchTerm || filterTrade || filterZip) && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              {filteredJobs.length} Auftrag{filteredJobs.length !== 1 ? 'e' : ''} gefunden
            </Typography>
            <Button
              size="small"
              onClick={() => {
                setSearchTerm('');
                setFilterTrade('');
                setFilterZip('');
              }}
              sx={{ mt: 1 }}
            >
              Filter zurücksetzen
            </Button>
          </Box>
        )}
      </Paper>

      {filteredJobs.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            {isCustomer()
              ? 'Sie haben noch keine Aufträge erstellt.'
              : 'Momentan sind keine Aufträge verfügbar.'}
          </Typography>
          {isCustomer() && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/jobs/create')}
              sx={{ mt: 2 }}
            >
              Ersten Auftrag erstellen
            </Button>
          )}
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {filteredJobs.map((job) => (
            <Grid item xs={12} md={6} key={job.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                    <Typography variant="h6" component="div">
                      {job.title}
                    </Typography>
                    <Chip
                      label={getStatusLabel(job.status)}
                      color={getStatusColor(job.status)}
                      size="small"
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {job.description.length > 150
                      ? `${job.description.substring(0, 150)}...`
                      : job.description}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 1 }}>
                    <Chip
                      icon={<Work />}
                      label={job.trade}
                      size="small"
                      variant="outlined"
                    />
                    <Chip
                      icon={<LocationOn />}
                      label={job.zip_code}
                      size="small"
                      variant="outlined"
                    />
                    {job.budget && (
                      <Chip
                        label={`${job.budget} €`}
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </Box>
                  {!isCustomer() && job.customer_username && (
                    <Typography variant="caption" color="text.secondary">
                      Kunde: {job.customer_username}
                    </Typography>
                  )}
                </CardContent>
                <CardActions>
                  <Button size="small" onClick={() => navigate(`/jobs/${job.id}`)}>
                    Details
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
}

export default Jobs;

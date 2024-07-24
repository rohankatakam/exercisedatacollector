import React, { useState } from 'react';
import {
    Container,
    TextField,
    Button,
    Typography,
    Box,
    Grid,
    Paper,
    MenuItem,
    Select,
    InputLabel,
    FormControl
} from '@mui/material';
import { Add, Download, LocalPrintshop } from '@mui/icons-material';

function ExerciseLabeler() {
    const [youtubeUrl, setYoutubeUrl] = useState('');
    const [youtubeUrlError, setYoutubeUrlError] = useState('');
    const [exerciseType, setExerciseType] = useState('Bench Press');
    const [sets, setSets] = useState([[{ start: '', end: '' }]]);
    const [videoId, setVideoId] = useState('');

    const handleUrlChange = (e) => {
        const url = e.target.value;
        setYoutubeUrl(url);
        const videoIdMatch = url.match(/(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/);
        if (videoIdMatch) {
            const videoId = videoIdMatch[1];
            setVideoId(videoId);
            setYoutubeUrlError('');
        } else {
            setVideoId('');
            setYoutubeUrlError('Invalid YouTube URL');
        }
    };

    const handleExerciseTypeChange = (e) => {
        setExerciseType(e.target.value);
    };

    const handleRepChange = (setIndex, repIndex, field, value) => {
        const newSets = sets.map((set, sIndex) => {
            if (sIndex === setIndex) {
                const newSet = set.map((rep, rIndex) => {
                    if (rIndex === repIndex) {
                        return { ...rep, [field]: value };
                    }
                    return rep;
                });
                return newSet;
            }
            return set;
        });
        setSets(newSets);
    };

    const addRep = (setIndex) => {
        const newSets = sets.map((set, sIndex) => {
            if (sIndex === setIndex) {
                return [...set, { start: '', end: '' }];
            }
            return set;
        });
        setSets(newSets);
    };

    const addSet = () => {
        setSets([...sets, [{ start: '', end: '' }]]);
    };

    const parseTimestamp = (timestamp) => {
        const [minute, second] = timestamp.split(':').map(Number);
        return { minute, second };
    };

    const toSeconds = (timestamp) => {
        const [minute, second] = timestamp.split(':').map(Number);
        return minute * 60 + second;
    };

    const handleSubmit = () => {
        const timestampPattern = /^([0-5]?[0-9]):([0-5][0-9])$/;
        const valid = sets.every(set =>
            set.every(rep =>
                timestampPattern.test(rep.start) &&
                timestampPattern.test(rep.end) &&
                toSeconds(rep.end) > toSeconds(rep.start)
            )
        );

        if (!valid) {
            alert("Please ensure all timestamps are in the format minute:second (e.g., 1:05, 5:40) and that end times are after start times.");
            return null;
        }

        const exerciseData = sets.map(set =>
            set.map(rep => ({
                start: parseTimestamp(rep.start),
                end: parseTimestamp(rep.end)
            }))
        );

        const data = { youtube_url: youtubeUrl, exercise_type: exerciseType, exercise_data: exerciseData };
        console.log('Data submitted:', data);
        return data;
        // Here you can handle data submission, e.g., save to local storage or send to an API.
    };

    const handleDownloadJson = () => {
        const data = handleSubmit();
        if (data) {
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'exercise_data.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url); // Clean up the object URL
        }
    };

    return (
        <Container maxWidth={false} sx={{ height: '100vh' }}>
            <Grid container spacing={2} sx={{ height: '100%' }}>
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2, height: 'calc(100% - 32px)', display: 'flex', flexDirection: 'column' }}>
                        <TextField
                            label="YouTube URL"
                            value={youtubeUrl}
                            onChange={handleUrlChange}
                            fullWidth
                            margin="normal"
                            error={!!youtubeUrlError}
                            helperText={youtubeUrlError}
                        />
                        <Box sx={{ flex: 1 }}>
                            {videoId && (
                                <iframe
                                    width="100%"
                                    height="100%"
                                    src={`https://www.youtube.com/embed/${videoId}`}
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    title="YouTube Video"
                                ></iframe>
                            )}
                        </Box>
                    </Paper>
                </Grid>
                <Grid item xs={12} md={6} sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
                        <FormControl fullWidth sx={{ mb: 2 }}>
                            <InputLabel id="exercise-type-label">Exercise Type</InputLabel>
                            <Select
                                labelId="exercise-type-label"
                                value={exerciseType}
                                label="Exercise Type"
                                onChange={handleExerciseTypeChange}
                            >
                                <MenuItem value="Bench Press">Bench Press</MenuItem>
                                <MenuItem value="Squat">Squat</MenuItem>
                                <MenuItem value="Deadlift">Deadlift</MenuItem>
                            </Select>
                        </FormControl>
                    </Paper>
                    <Paper sx={{ p: 2, flex: 1, overflowY: 'auto' }}>
                        {sets.map((set, setIndex) => (
                            <Box key={setIndex} sx={{ mb: 2 }}>
                                <Typography variant="subtitle1">Set {setIndex + 1}</Typography>
                                {set.map((rep, repIndex) => (
                                    <Box key={repIndex} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                        <TextField
                                            label={`Rep ${repIndex + 1} Start Time`}
                                            value={rep.start}
                                            onChange={(e) => handleRepChange(setIndex, repIndex, 'start', e.target.value)}
                                            sx={{ mr: 1 }}
                                            placeholder="minute:second"
                                            inputProps={{ pattern: "^([0-5]?[0-9]):([0-5][0-9])$" }}
                                        />
                                        <TextField
                                            label={`Rep ${repIndex + 1} End Time`}
                                            value={rep.end}
                                            onChange={(e) => handleRepChange(setIndex, repIndex, 'end', e.target.value)}
                                            placeholder="minute:second"
                                            inputProps={{ pattern: "^([0-5]?[0-9]):([0-5][0-9])$" }}
                                        />
                                    </Box>
                                ))}
                                <Button
                                    startIcon={<Add />}
                                    onClick={() => addRep(setIndex)}
                                >
                                    Add Rep
                                </Button>
                            </Box>
                        ))}
                    </Paper>
                    <Paper sx={{ p: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Button
                                variant="outlined"
                                startIcon={<Add />}
                                onClick={addSet}
                            >
                                Add Set
                            </Button>
                            <Button variant="outlined" startIcon={<Download />} onClick={handleDownloadJson}>
                                Download JSON
                            </Button>
                            <Button variant="outlined" startIcon={<LocalPrintshop />} onClick={handleSubmit}>
                                Console Log
                            </Button>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>
        </Container>
    );
}

export default ExerciseLabeler;

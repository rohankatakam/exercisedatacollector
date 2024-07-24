import React, { useState, useRef } from 'react';
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
    FormControl,
    IconButton,
    Accordion,
    AccordionSummary,
    AccordionDetails
} from '@mui/material';
import { Add, Download, LocalPrintshop, Delete, ExpandMore, PlayArrow } from '@mui/icons-material';
import YouTube from 'react-youtube';

function ExerciseDataCollector() {
    const [youtubeUrl, setYoutubeUrl] = useState('');
    const [youtubeUrlError, setYoutubeUrlError] = useState('');
    const [exerciseType, setExerciseType] = useState('Bench Press');
    const [sets, setSets] = useState([[{ start: '', end: '' }]]);
    const [videoId, setVideoId] = useState('');
    const playerRef = useRef(null);

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

    const deleteRep = (setIndex, repIndex) => {
        const newSets = sets.map((set, sIndex) => {
            if (sIndex === setIndex) {
                return set.filter((_, rIndex) => rIndex !== repIndex);
            }
            return set;
        });
        setSets(newSets);
    };

    const addSet = () => {
        setSets([...sets, [{ start: '', end: '' }]]);
    };

    const deleteSet = (setIndex) => {
        const newSets = sets.filter((_, sIndex) => sIndex !== setIndex);
        setSets(newSets);
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

    const playClipsInSequence = () => {
        const player = playerRef.current.getInternalPlayer();
        let currentSetIndex = 0;
        let currentRepIndex = 0;

        const playNextRep = () => {
            if (currentSetIndex < sets.length && currentRepIndex < sets[currentSetIndex].length) {
                const rep = sets[currentSetIndex][currentRepIndex];
                const startTime = toSeconds(rep.start);
                const endTime = toSeconds(rep.end);

                player.seekTo(startTime, true);
                player.playVideo();

                const checkTime = () => {
                    player.getCurrentTime().then(currentTime => {
                        if (currentTime >= endTime) {
                            player.pauseVideo();
                            currentRepIndex++;
                            if (currentRepIndex >= sets[currentSetIndex].length) {
                                currentSetIndex++;
                                currentRepIndex = 0;
                            }
                            playNextRep();
                        } else {
                            setTimeout(checkTime, 100);
                        }
                    });
                };

                setTimeout(checkTime, 100);
            }
        };

        playNextRep();
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
                        <Box sx={{ flex: 1, height: '100%' }}>
                            {videoId && (
                                <YouTube
                                    videoId={videoId}
                                    ref={playerRef}
                                    opts={{
                                        height: '100%',
                                        width: '100%',
                                        playerVars: { autoplay: 0 }
                                    }}
                                    style={{ height: '100%', width: '100%' }}
                                />
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
                            <Accordion key={setIndex} sx={{ mb: 2 }}>
                                <AccordionSummary
                                    expandIcon={<ExpandMore />}
                                    aria-controls={`panel${setIndex}-content`}
                                    id={`panel${setIndex}-header`}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                        <Typography>Set {setIndex + 1}</Typography>
                                        <IconButton onClick={() => deleteSet(setIndex)} size="small">
                                            <Delete />
                                        </IconButton>
                                    </Box>
                                </AccordionSummary>
                                <AccordionDetails>
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
                                                sx={{ mr: 1 }}
                                            />
                                            <IconButton onClick={() => deleteRep(setIndex, repIndex)} size="small">
                                                <Delete />
                                            </IconButton>
                                        </Box>
                                    ))}
                                    <Button
                                        startIcon={<Add />}
                                        onClick={() => addRep(setIndex)}
                                    >
                                        Add Rep
                                    </Button>
                                </AccordionDetails>
                            </Accordion>
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
                            <Button variant="outlined" startIcon={<PlayArrow />} onClick={playClipsInSequence}>
                                Play Clips
                            </Button>
                            <Button variant="outlined" color="success" startIcon={<Download />} onClick={handleDownloadJson}>
                                Download JSON
                            </Button>
                            <Button variant="outlined" color="secondary" startIcon={<LocalPrintshop />} onClick={handleSubmit}>
                                Console Log
                            </Button>

                        </Box>
                    </Paper>
                </Grid>
            </Grid>
        </Container>
    );
}

export default ExerciseDataCollector;

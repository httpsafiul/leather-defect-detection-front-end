import React, { useState } from 'react';
import { AppBar, Toolbar, Typography, Button, IconButton, Dialog, DialogActions, DialogContent, DialogTitle, Grid, Divider, Backdrop, CircularProgress } from '@mui/material';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import UploadFile from '@mui/icons-material/UploadFile';
import Webcam from 'react-webcam';
import axios from 'axios';

const HomeMain = () => {
  const [image, setImage] = useState(null);
  const [open, setOpen] = useState(false);
  const [webcamImage, setWebcamImage] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);
  const [imageSrc, setImageSrc] = useState('');
  const [anomaly, setAnomaly] = useState(false);
  const [backdrop, setBackdrop] = useState(false);
  const [imageData, setImageData] = useState({

  });

  const handleUploadClick = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result);
      };
      reader.readAsDataURL(file);
      setUploadFile(file);
    }
  };

  const handleOpenDialog = () => {
    setOpen(true);
  };

  const handleCloseDialog = () => {
    setOpen(false);
  };

  const capture = (webcamRef) => {
    const imageSrc = webcamRef.current.getScreenshot();
    setWebcamImage(imageSrc);
    setImage(imageSrc);

    // Convert base64 to File
    fetch(imageSrc)
      .then(res => res.blob())
      .then(blob => {
        const file = new File([blob], "webcam_image.jpg", { type: "image/jpeg" });
        setUploadFile(file);
      });

    handleCloseDialog();
  };

  const unselectImage = () => {
    setImage(null);
    setWebcamImage(null);
    setUploadFile(null);
  };

  const webcamRef = React.useRef(null);

  const handleSubmit = () => {
    const formData = new FormData();
    if (uploadFile.name.length > 0) {
      formData.append('file', uploadFile);
    }
    postForm(formData);
  };

  function postForm(formData) {
    setBackdrop(true)
    console.log(formData);
    axios
      .post(
        `http://127.0.0.1:8000/predict`,
        formData
      )
      .then((res) => {
        // setIsSubmitting(false);
        // Decode base64 string and create a Blob object
        const byteCharacters = atob(res.data.image_data);
        const byteNumbers = new Array(byteCharacters.length).fill().map((_, i) => byteCharacters.charCodeAt(i));
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'image/jpeg' }); // Change the MIME type accordingly

        // Create a URL for the Blob object
        const blobUrl = URL.createObjectURL(blob);
        setImageSrc(blobUrl);

        if (res.data.anomaly_detected) {
          setAnomaly(true)
        }
        setBackdrop(false)

        setImageData({
          "original_image_area": 1000*res.data.original_image_area,
          "total_segmented_region_area": 1000*res.data.total_segmented_region_area,
          "mask_area": 1000*res.data.mask_area,
        })

        // Cleanup the Blob URL when the component unmounts
        return () => URL.revokeObjectURL(blobUrl);
      })
      .catch((err) => {
        console.log(err);
      });
  }

  return (
    <div style={{ textAlign: 'center' }}>
      <AppBar sx={{ width: "100%", display: "flex", justifyContent: "center", alignItems: "center" }} position="static">
        <Toolbar>
          <Typography variant="h5">
            Leather Defect Detection
          </Typography>
        </Toolbar>
      </AppBar>
      <Grid container>
        <Grid item xs={5} sx={{ height: "90vh" }}>
          <div style={{ marginTop: '20px', marginBottom: "20px", display: 'flex', justifyContent: 'space-between', alignItems: "center", height: "160px", flexDirection: "column" }}>
            <Typography variant="h6">UPLOAD RAW MATERIAL IMAGE</Typography>
            <div>
              <input
                accept="image/*"
                style={{ display: 'none' }}
                id="upload-file"
                type="file"
                onChange={handleUploadClick}
              />
              <label htmlFor="upload-file">
                <IconButton color="primary" component="span" style={{ transform: 'scale(3)', marginRight: "60px" }}>
                  <UploadFile fontSize="large" />
                </IconButton>
              </label>
              <IconButton color="primary" onClick={handleOpenDialog} style={{ transform: 'scale(3)', marginLeft: "60px" }}>
                <PhotoCamera fontSize="large" />
              </IconButton>
            </div>
          </div>
          <Dialog open={open} onClose={handleCloseDialog} maxWidth="lg" >
            <DialogTitle>Capture Image</DialogTitle>
            <DialogContent>
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                width="100%"
                height="100%"
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => capture(webcamRef)} color="primary">
                Capture
              </Button>
              <Button onClick={handleCloseDialog} color="primary">
                Cancel
              </Button>
            </DialogActions>
          </Dialog>
          {image && (
            <div style={{ marginTop: '20px', height: "50vh" }}>
              <img src={image} alt="Raw material" style={{ width: '275px', height: '275px', objectFit: 'contain' }} />
              <div>
                <Button variant="contained" color="primary" style={{ marginTop: '10px', marginRight: '10px' }} onClick={handleSubmit}>
                  Upload
                </Button>
                <Button variant="outlined" color="secondary" style={{ marginTop: '10px' }} onClick={unselectImage}>
                  Unselect
                </Button>
              </div>
            </div>
          )}
        </Grid>
        <Divider orientation="vertical" variant="middle" flexItem />
        <Grid item xs={6.9} sx={{ height: "90vh" }}>
          {imageSrc && (
            <div style={{ height: "100%", display: "flex", alignItems: "center", flexDirection: "column", }}>
              {anomaly && (
                <Typography sx={{ marginTop: "20px", marginBottom: "10px" }} color={"red"} variant="h5">Anomaly Detected</Typography>
              )}
              {!anomaly && (
                <Typography sx={{ marginTop: "20px", marginBottom: "10px" }} color={"green"} variant="h5">No Anomaly Deteceted</Typography>
              )}
              {/* <Typography sx={{fontWeight: "bold"}} variant="subtitle1">Original Image Area: {imageData.original_image_area}  sq m</Typography>
              <Typography sx={{fontWeight: "bold"}} variant="subtitle1">Total Segmented Region Area: {imageData.total_segmented_region_area} sq m</Typography>
              <Typography sx={{fontWeight: "bold"}} variant="subtitle1">Mask Area: {imageData.mask_area} sq m</Typography> */}
              <img src={imageSrc} alt="Raw material" style={{ width: '700px', height: '700px', objectFit: 'contain' }} />
            </div>
          )}
        </Grid>
      </Grid>
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={backdrop}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
    </div>
  );
};

export default HomeMain;

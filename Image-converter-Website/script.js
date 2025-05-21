document.addEventListener('DOMContentLoaded', function() {
  // Import GSAP library
  const gsap = window.gsap;

  // Initialize GSAP animations
  initAnimations();
  
  // Set current year in footer
  document.getElementById('current-year').textContent = new Date().getFullYear();
  
  // Theme toggle functionality
  const themeToggle = document.getElementById('theme-toggle-checkbox');
  
  // Check for saved theme preference or use preferred color scheme
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    document.body.classList.add('dark-mode');
    document.body.classList.remove('light-mode');
    themeToggle.checked = true;
  } else if (savedTheme === 'light') {
    document.body.classList.add('light-mode');
    document.body.classList.remove('dark-mode');
    themeToggle.checked = false;
  } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.body.classList.add('dark-mode');
    document.body.classList.remove('light-mode');
    themeToggle.checked = true;
  }
  
  themeToggle.addEventListener('change', function() {
    if (this.checked) {
      document.body.classList.add('dark-mode');
      document.body.classList.remove('light-mode');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.add('light-mode');
      document.body.classList.remove('dark-mode');
      localStorage.setItem('theme', 'light');
    }
    // Reinitialize animations when theme changes
    initAnimations();
  });
  
  // Tab functionality
  const tabButtons = document.querySelectorAll('.tab-btn');
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const tabName = button.getAttribute('data-tab');
      
      // Update active tab button
      tabButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      
      // Update active tab pane
      const tabPanes = document.querySelectorAll('.tab-pane');
      tabPanes.forEach(pane => pane.classList.remove('active'));
      document.getElementById(`${tabName}-tab`).classList.add('active');
    });
  });
  
  // Image upload functionality
  const uploadArea = document.getElementById('upload-area');
  const fileInput = document.getElementById('file-input');
  const browseBtn = document.getElementById('browse-btn');
  const resetBtn = document.getElementById('reset-btn');
  const convertBtn = document.getElementById('convert-btn');
  const downloadBtn = document.getElementById('download-btn');
  const convertAgainBtn = document.getElementById('convert-again-btn');
  const converterInterface = document.getElementById('converter-interface');
  const previewImage = document.getElementById('preview-image');
  const imageInfo = document.getElementById('image-info');
  const formatBadge = document.getElementById('format-badge');
  
  let uploadedImage = null;
  let uploadedImageName = '';
  let convertedImage = null;
  
  // Drag and drop functionality
  uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragging');
  });
  
  uploadArea.addEventListener('dragleave', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragging');
  });
  
  uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragging');
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageUpload(e.dataTransfer.files[0]);
    }
  });
  
  uploadArea.addEventListener('click', () => {
    fileInput.click();
  });
  
  browseBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    fileInput.click();
  });
  
  fileInput.addEventListener('change', () => {
    if (fileInput.files && fileInput.files[0]) {
      handleImageUpload(fileInput.files[0]);
    }
  });
  
  resetBtn.addEventListener('click', resetConverter);
  
  // Format selection
  const formatOptions = document.querySelectorAll('input[name="format"]');
  let selectedFormat = 'png';
  
  formatOptions.forEach(option => {
    option.addEventListener('change', () => {
      selectedFormat = option.value;
      if (convertedImage) {
        convertedImage = null;
        downloadBtn.style.display = 'none';
        convertAgainBtn.style.display = 'none';
        convertBtn.style.display = 'block';
        formatBadge.style.display = 'none';
        previewImage.src = uploadedImage;
        updateImageInfo();
      }
    });
  });
  
  // Convert button
  convertBtn.addEventListener('click', convertImage);
  
  // Download button
  downloadBtn.addEventListener('click', downloadImage);
  
  // Convert again button
  convertAgainBtn.addEventListener('click', () => {
    convertImage();
  });
  
  function handleImageUpload(file) {
    // Check if file is an image
    if (!file.type.match('image.*')) {
      showToast('Invalid file type', 'Please upload an image file.');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      uploadedImage = e.target.result;
      uploadedImageName = file.name;
      convertedImage = null;
      
      // Show converter interface
      uploadArea.style.display = 'none';
      converterInterface.style.display = 'block';
      
      // Update preview
      previewImage.src = uploadedImage;
      updateImageInfo();
      
      // Reset buttons
      downloadBtn.style.display = 'none';
      convertAgainBtn.style.display = 'none';
      convertBtn.style.display = 'block';
      formatBadge.style.display = 'none';
      
      // Animate the new interface
      gsap.from(converterInterface, {
        opacity: 0,
        y: 20,
        duration: 0.5,
        ease: 'power2.out'
      });
    };
    reader.readAsDataURL(file);
  }
  
  function convertImage() {
    if (!uploadedImage) return;
    
    // Show loading state
    convertBtn.disabled = true;
    const originalBtnText = convertBtn.innerHTML;
    convertBtn.innerHTML = '<span class="loading-spinner"></span>Converting...';
    
    setTimeout(() => {
      try {
        // Create an image element to load the uploaded image
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        img.onload = () => {
          // Create a canvas to draw the image
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            throw new Error('Could not get canvas context');
          }
          
          // Draw the image on the canvas
          ctx.drawImage(img, 0, 0);
          
          // Convert the canvas to the selected format
          const mimeType = `image/${selectedFormat === 'jpeg' ? 'jpeg' : selectedFormat}`;
          const quality = selectedFormat === 'jpeg' ? 0.9 : 1;
          const dataUrl = canvas.toDataURL(mimeType, quality);
          
          // Generate a new filename
          const fileExtension = selectedFormat === 'jpeg' ? 'jpg' : selectedFormat;
          const originalName = uploadedImageName.split('.').slice(0, -1).join('.');
          const newFileName = `${originalName}.${fileExtension}`;
          
          convertedImage = {
            format: selectedFormat,
            url: dataUrl,
            name: newFileName
          };
          
          // Update UI
          previewImage.src = convertedImage.url;
          formatBadge.textContent = selectedFormat.toUpperCase();
          formatBadge.style.display = 'block';
          updateImageInfo();
          
          // Update buttons
          convertBtn.style.display = 'none';
          downloadBtn.style.display = 'block';
          convertAgainBtn.style.display = 'block';
          
          // Animate the format badge
          gsap.from(formatBadge, {
            scale: 0,
            opacity: 0,
            duration: 0.5,
            ease: 'back.out(1.7)'
          });
          
          showToast('Conversion complete', `Image converted to ${selectedFormat.toUpperCase()} format.`);
        };
        
        img.onerror = () => {
          throw new Error('Error loading image');
        };
        
        img.src = uploadedImage;
      } catch (error) {
        console.error('Error converting image:', error);
        showToast('Conversion failed', 'There was an error converting your image. Please try again.');
      } finally {
        // Reset button state
        convertBtn.disabled = false;
        convertBtn.innerHTML = originalBtnText;
      }
    }, 1000); // Simulate processing time
  }
  
  function downloadImage() {
    if (!convertedImage) return;
    
    const link = document.createElement('a');
    link.href = convertedImage.url;
    link.download = convertedImage.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast('Download started', `Your ${convertedImage.format.toUpperCase()} image is downloading.`);
  }
  
  function resetConverter() {
    uploadedImage = null;
    uploadedImageName = '';
    convertedImage = null;
    
    // Reset UI
    converterInterface.style.display = 'none';
    uploadArea.style.display = 'flex';
    fileInput.value = '';
    
    // Animate the upload area
    gsap.from(uploadArea, {
      opacity: 0,
      y: 20,
      duration: 0.5,
      ease: 'power2.out'
    });
  }
  
  function updateImageInfo() {
    if (convertedImage) {
      imageInfo.textContent = `${uploadedImageName} → ${convertedImage.name}`;
    } else {
      imageInfo.textContent = uploadedImageName;
    }
  }
  
  function showToast(title, message) {
    const toast = document.getElementById('toast');
    const toastTitle = document.getElementById('toast-title');
    const toastMessage = document.getElementById('toast-message');
    
    toastTitle.textContent = title;
    toastMessage.textContent = message;
    
    toast.classList.add('show');
    
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  }
  
  function initAnimations() {
    // Animate blobs
    gsap.to('.blob-1', {
      x: 50,
      y: 100,
      duration: 20,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut'
    });
    
    gsap.to('.blob-2', {
      x: -30,
      y: -60,
      duration: 15,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
      delay: 0.5
    });
    
    gsap.to('.blob-3', {
      x: 80,
      y: -40,
      duration: 18,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
      delay: 1
    });
    
    // Animate hero text
    gsap.from('.hero-content h1', {
      y: 30,
      opacity: 0,
      duration: 1,
      ease: 'power3.out'
    });
    
    gsap.from('.hero-content p', {
      y: 30,
      opacity: 0,
      duration: 1,
      delay: 0.2,
      ease: 'power3.out'
    });
    
    gsap.from('.converter-card', {
      y: 30,
      opacity: 0,
      duration: 1,
      delay: 0.4,
      ease: 'power3.out'
    });
    
    // Animate feature cards on scroll
    const featureCards = document.querySelectorAll('.feature-card');
    
    gsap.from(featureCards, {
      y: 50,
      opacity: 0,
      duration: 0.8,
      stagger: 0.2,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: '.features',
        start: 'top 80%'
      }
    });
    
    // Animate FAQ items on scroll
    const faqItems = document.querySelectorAll('.faq-item');
    
    gsap.from(faqItems, {
      y: 30,
      opacity: 0,
      duration: 0.6,
      stagger: 0.15,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: '.faq',
        start: 'top 80%'
      }
    });
  }
});
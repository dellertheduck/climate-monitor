# Arduino Climate Monitor - Cloud Deployment

Deploy your climate monitor to the cloud for permanent website access from any device, anywhere.

## 🌐 Quick Deployment Options

### **Option 1: GitHub Pages (Free & Easiest)**

1. **Create GitHub Repository**
   ```bash
   git init
   git add .
   git commit -m "Initial climate monitor"
   git branch -M main
   git remote add origin https://github.com/yourusername/climate-monitor.git
   git push -u origin main
   ```

2. **Enable GitHub Pages**
   - Go to repository Settings → Pages
   - Source: Deploy from branch → Main → Root
   - Save and wait 2-5 minutes

3. **Access Your Site**
   ```
   https://yourusername.github.io/climate-monitor
   ```

### **Option 2: Netlify (Free & Custom Domain)**

1. **Drag & Drop Deploy**
   - Go to [netlify.com](https://netlify.com)
   - Drag the `deploy` folder onto the deploy area
   - Get instant URL: `https://random-name-123.netlify.app`

2. **Custom Domain (Optional)**
   - Add custom domain in Netlify settings
   - Update DNS records

### **Option 3: Vercel (Free & Modern)**

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy**
   ```bash
   cd deploy
   vercel --prod
   ```

### **Option 4: Firebase Hosting (Free)**

1. **Install Firebase CLI**
   ```bash
   npm install -g firebase-tools
   ```

2. **Initialize Firebase**
   ```bash
   firebase init hosting
   firebase deploy
   ```

## 🚀 Deployment Steps

### **Step 1: Prepare Files**
Copy these files to your hosting service:
- `index.html`
- `app.js`
- (All files are in the `deploy` folder)

### **Step 2: Upload to Host**
Choose any of the options above or your preferred hosting service.

### **Step 3: Access Your Site**
Your climate monitor will be accessible from:
- Any device with internet
- Any browser (Chrome/Edge recommended for Web Bluetooth)
- Any location in the world

## 📱 Usage Instructions

Once deployed:

1. **Visit your permanent URL**
2. **Connect to Arduino** (same network required for Bluetooth)
3. **Monitor data** from anywhere

## 🔧 Important Notes

### **Web Bluetooth Requirements**
- **Browser**: Chrome, Edge, or Opera
- **Network**: Must be on same local network as Arduino for Bluetooth
- **Permissions**: Allow Bluetooth when prompted
- **HTTPS**: Automatically provided by cloud hosting

### **Limitations**
- Bluetooth range limited to local network
- Cannot connect to Arduino from different networks
- Web Bluetooth API requires user interaction each time

### **Workarounds**
- Use **VPN** to access home network remotely
- Set up **port forwarding** for remote access
- Consider **WiFi module** instead of Bluetooth for true remote access

## 🌍 Example URLs

- **GitHub Pages**: `https://yourname.github.io/climate-monitor`
- **Netlify**: `https://climate-monitor.netlify.app`
- **Vercel**: `https://climate-monitor.vercel.app`
- **Custom**: `https://monitor.yourdomain.com`

## 📊 Features Available

✅ **Real-time monitoring**  
✅ **Interactive charts**  
✅ **Data export**  
✅ **Mobile responsive**  
✅ **No installation required**  
✅ **Permanent online access**  

## 🔒 Security Considerations

- **HTTPS enabled** by all cloud hosts
- **No data stored on server** (browser-only)
- **Local Bluetooth only** (no remote access)
- **No authentication required**

## 🆚 Local vs Cloud

| Feature | Local Server | Cloud Hosted |
|---------|---------------|--------------|
| **Setup** | Run server locally | Upload files once |
| **Access** | Same network only | Anywhere in world |
| **URL** | `http://localhost:8000` | `https://your-site.com` |
| **SSL** | Manual setup | Automatic |
| **Maintenance** | Keep server running | None |

## 🎯 Recommended Setup

**For most users**: Use **GitHub Pages** - it's free, easy, and reliable.

**For custom domain**: Use **Netlify** - drag & drop deployment.

**For advanced users**: Use **Vercel** - modern features and analytics.

Your climate monitor will be a permanent website accessible from any device, anywhere!

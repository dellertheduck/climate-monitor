// Arduino Climate Monitor - Universal Bluetooth Script
// Works with ANY HC-05 configuration on ANY device

// Global variables
let bluetoothDevice = null;
let bluetoothServer = null;
let bluetoothService = null;
let bluetoothCharacteristic = null;
let isConnected = false;

// Data storage
let temperatureData = [];
let humidityData = [];
let heatIndexData = [];
let timestamps = [];
let allData = [];

// Chart instances
let tempChart = null;
let humChart = null;

// Initialize charts
function initCharts() {
    const tempCtx = document.getElementById('tempChart').getContext('2d');
    const humCtx = document.getElementById('humChart').getContext('2d');

    // Temperature & Heat Index Chart
    tempChart = new Chart(tempCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Temperature (°C)',
                    data: [],
                    borderColor: 'rgb(239, 68, 68)',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    tension: 0.4,
                    borderWidth: 2
                },
                {
                    label: 'Heat Index (°C)',
                    data: [],
                    borderColor: 'rgb(251, 146, 60)',
                    backgroundColor: 'rgba(251, 146, 60, 0.1)',
                    tension: 0.4,
                    borderWidth: 2,
                    borderDash: [5, 5]
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: false,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            },
            animation: {
                duration: 0
            }
        }
    });

    // Humidity Chart
    humChart = new Chart(humCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Humidity (%)',
                    data: [],
                    borderColor: 'rgb(59, 130, 246)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4,
                    borderWidth: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: false,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            },
            animation: {
                duration: 0
            }
        }
    });
}

// Toggle Bluetooth connection
async function toggleConnection() {
    if (!isConnected) {
        await connectBluetooth();
    } else {
        disconnectBluetooth();
    }
}

// UNIVERSAL BLUETOOTH CONNECTION - Works with ANY device
async function connectBluetooth() {
    try {
        console.log('🔍 Starting universal Bluetooth scan...');
        
        // Step 1: Request ANY Bluetooth device
        bluetoothDevice = await navigator.bluetooth.requestDevice({
            acceptAllDevices: true,
            optionalServices: []  // No restrictions - accept ANY device
        });

        console.log('✅ Device selected:', bluetoothDevice.name || 'Unknown device');
        
        // Step 2: Connect to GATT server
        console.log('🔗 Connecting to GATT server...');
        bluetoothServer = await bluetoothDevice.gatt.connect();
        console.log('✅ GATT connected');

        // Step 3: Get ALL available services
        console.log('🔍 Discovering all services...');
        const services = await bluetoothServer.getPrimaryServices();
        console.log(`📋 Found ${services.length} services`);

        if (services.length === 0) {
            throw new Error('No services found. Device may not be compatible.');
        }

        // Step 4: Find ANY working characteristic
        let targetService = null;
        let targetCharacteristic = null;

        for (let i = 0; i < services.length; i++) {
            const service = services[i];
            console.log(`🔍 Checking service ${i + 1}/${services.length}: ${service.uuid}`);
            
            try {
                const characteristics = await service.getCharacteristics();
                console.log(`  📊 Found ${characteristics.length} characteristics`);
                
                if (characteristics.length > 0) {
                    targetService = service;
                    
                    // Step 5: Test each characteristic for data capability
                    for (let j = 0; j < characteristics.length; j++) {
                        const char = characteristics[j];
                        console.log(`  🧪 Testing characteristic ${j + 1}: ${char.uuid}`);
                        
                        try {
                            // Test if we can read from this characteristic
                            const value = await char.readValue();
                            console.log(`  ✅ Characteristic ${j + 1} is readable`);
                            
                            // Test if we can start notifications
                            await char.startNotifications();
                            await char.stopNotifications();
                            console.log(`  🔔 Characteristic ${j + 1} supports notifications`);
                            
                            targetCharacteristic = char;
                            break;
                        } catch (e) {
                            console.log(`  ❌ Characteristic ${j + 1} failed: ${e.message}`);
                            continue;
                        }
                    }
                    
                    // If no notification-capable characteristic, use first readable one
                    if (!targetCharacteristic && characteristics.length > 0) {
                        targetCharacteristic = characteristics[0];
                        console.log(`  📡 Using first available characteristic: ${targetCharacteristic.uuid}`);
                    }
                    
                    break;
                }
            } catch (e) {
                console.log(`  ❌ Cannot access service: ${e.message}`);
                continue;
            }
        }

        if (!targetCharacteristic) {
            throw new Error('No working characteristic found. Device may not be compatible.');
        }

        // Step 6: Set up connection
        bluetoothService = targetService;
        bluetoothCharacteristic = targetCharacteristic;

        console.log('🎯 FINAL CONNECTION SETUP:');
        console.log(`  Service: ${bluetoothService.uuid}`);
        console.log(`  Characteristic: ${bluetoothCharacteristic.uuid}`);

        // Step 7: Start listening for data
        await bluetoothCharacteristic.startNotifications();
        console.log('🔔 Notifications started - ready for data!');
        
        // Step 8: Set up data listener
        bluetoothCharacteristic.addEventListener('characteristicvaluechanged', handleBluetoothData);
        
        // Step 9: Update UI
        isConnected = true;
        updateConnectionStatus(true);
        
        // Step 10: Handle disconnection
        bluetoothDevice.addEventListener('gattserverdisconnected', onDisconnected);
        
        console.log('🎉 CONNECTION SUCCESSFUL!');
        
    } catch (error) {
        console.error('❌ CONNECTION FAILED:', error);
        handleConnectionError(error);
    }
}

// Handle connection errors with detailed guidance
function handleConnectionError(error) {
    let errorMessage = error.message;
    let userMessage = '';
    
    if (errorMessage.includes('User cancelled') || errorMessage.includes('cancelled')) {
        userMessage = 'Connection cancelled by user.';
    } else if (errorMessage.includes('No services found')) {
        userMessage = '❌ DEVICE NOT COMPATIBLE\n\nSolutions:\n1. Try different HC-05 module\n2. Check Arduino wiring\n3. Use Desktop App instead';
    } else if (errorMessage.includes('No working characteristic')) {
        userMessage = '❌ BLUETOOTH PROTOCOL MISMATCH\n\nSolutions:\n1. Restart HC-05 module\n2. Re-pair with device\n3. Try different device\n4. Use Desktop App';
    } else if (errorMessage.includes('Bluetooth') || errorMessage.includes('GATT')) {
        userMessage = '❌ BLUETOOTH CONNECTION ERROR\n\nSolutions:\n1. Make sure HC-05 is powered\n2. Move closer to device\n3. Re-pair HC-05\n4. Try Chrome/Edge browser\n5. Use Desktop App';
    } else {
        userMessage = `❌ UNKNOWN ERROR: ${errorMessage}\n\nTry:\n1. Refresh page and retry\n2. Use Desktop App\n3. Check device compatibility`;
    }
    
    alert(userMessage);
    updateConnectionStatus(false);
}

// Handle incoming Bluetooth data
function handleBluetoothData(event) {
    const value = event.target.value;
    const decoder = new TextDecoder('utf-8');
    const data = decoder.decode(value);
    
    console.log('📡 RAW DATA:', data);
    
    // Try to parse JSON data
    try {
        const jsonData = JSON.parse(data.trim());
        console.log('✅ PARSED DATA:', jsonData);
        updateDisplay(jsonData);
    } catch (e) {
        console.log('⚠️ Not JSON, searching for JSON in string...');
        
        // Try to extract JSON from mixed data
        const jsonMatch = data.match(/\{[^}]*\}/);
        if (jsonMatch) {
            try {
                const jsonData = JSON.parse(jsonMatch[0]);
                console.log('✅ EXTRACTED JSON:', jsonData);
                updateDisplay(jsonData);
            } catch (e2) {
                console.log('❌ Could not parse extracted JSON:', jsonMatch[0]);
            }
        } else {
            console.log('❌ No JSON found in data');
        }
    }
}

// Update display with new data
function updateDisplay(data) {
    const now = new Date();
    const timeString = now.toLocaleTimeString();
    
    // Update current readings
    document.getElementById('tempValue').textContent = `${data.temp.toFixed(1)}°C`;
    document.getElementById('humValue').textContent = `${data.hum.toFixed(1)}%`;
    document.getElementById('hiValue').textContent = `${data.hi.toFixed(1)}°C`;
    document.getElementById('comfortValue').textContent = data.comfort || '--';
    document.getElementById('statusValue').textContent = data.status || '--';
    document.getElementById('updateTime').textContent = timeString;
    
    // Update comfort card styling
    updateComfortCard(data.comfort);
    
    // Update status styling
    updateStatusStyling(data.status);
    
    // Store data
    temperatureData.push(data.temp);
    humidityData.push(data.hum);
    heatIndexData.push(data.hi);
    timestamps.push(timeString);
    
    // Store for export
    allData.push({
        timestamp: now.toISOString(),
        temp: data.temp,
        hum: data.hum,
        hi: data.hi,
        comfort: data.comfort,
        status: data.status
    });
    
    // Keep only last 50 data points
    if (temperatureData.length > 50) {
        temperatureData.shift();
        humidityData.shift();
        heatIndexData.shift();
        timestamps.shift();
    }
    
    // Update charts
    updateCharts();
}

// Update comfort card styling
function updateComfortCard(comfort) {
    const card = document.getElementById('comfortCard');
    card.className = 'p-3 rounded-lg text-white';
    
    if (comfort === 'Comfortable') {
        card.classList.add('comfort-comfortable');
    } else if (comfort === 'A little cold') {
        card.classList.add('comfort-cold');
    } else if (comfort === 'A little hot' || comfort === 'Uncomfortable' || comfort === 'Too hot') {
        card.classList.add('comfort-hot');
    } else {
        card.classList.add('comfort-warm');
    }
}

// Update status styling
function updateStatusStyling(status) {
    const statusElement = document.getElementById('statusValue');
    
    if (status === 'Very Cold' || status === 'Cold') {
        statusElement.className = 'text-lg font-bold text-blue-600';
    } else if (status === 'Warm') {
        statusElement.className = 'text-lg font-bold text-green-600';
    } else if (status === 'Hot' || status === 'Very Hot') {
        statusElement.className = 'text-lg font-bold text-red-600';
    } else {
        statusElement.className = 'text-lg font-bold text-gray-700';
    }
}

// Update charts
function updateCharts() {
    if (!tempChart || !humChart) return;
    
    tempChart.data.labels = timestamps;
    tempChart.data.datasets[0].data = temperatureData;
    tempChart.data.datasets[1].data = heatIndexData;
    tempChart.update();
    
    humChart.data.labels = timestamps;
    humChart.data.datasets[0].data = humidityData;
    humChart.update();
}

// Update connection status UI
function updateConnectionStatus(connected) {
    const connectBtn = document.getElementById('connectBtn');
    const statusText = document.getElementById('connectionStatus');
    const statusDot = document.getElementById('connectionDot');
    
    if (connected) {
        connectBtn.innerHTML = '<i class="fas fa-bluetooth-slash mr-2"></i>Disconnect';
        connectBtn.className = 'bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors';
        statusText.textContent = 'Connected';
        statusDot.className = 'w-3 h-3 bg-green-500 rounded-full connection-dot';
    } else {
        connectBtn.innerHTML = '<i class="fas fa-bluetooth mr-2"></i>Connect';
        connectBtn.className = 'bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors';
        statusText.textContent = 'Disconnected';
        statusDot.className = 'w-3 h-3 bg-red-500 rounded-full';
    }
}

// Handle disconnection
function onDisconnected() {
    console.log('📱 Bluetooth device disconnected');
    isConnected = false;
    updateConnectionStatus(false);
    
    // Reset variables
    bluetoothDevice = null;
    bluetoothServer = null;
    bluetoothService = null;
    bluetoothCharacteristic = null;
}

// Disconnect Bluetooth
function disconnectBluetooth() {
    if (bluetoothDevice && bluetoothDevice.gatt.connected) {
        bluetoothDevice.gatt.disconnect();
    }
}

// Clear all data
function clearData() {
    temperatureData = [];
    humidityData = [];
    heatIndexData = [];
    timestamps = [];
    allData = [];
    
    // Reset display
    document.getElementById('tempValue').textContent = '--°C';
    document.getElementById('humValue').textContent = '--%';
    document.getElementById('hiValue').textContent = '--°C';
    document.getElementById('comfortValue').textContent = '--';
    document.getElementById('statusValue').textContent = '--';
    document.getElementById('updateTime').textContent = '--:--:--';
    
    // Reset comfort card
    const card = document.getElementById('comfortCard');
    card.className = 'p-3 rounded-lg bg-gray-500';
    
    // Reset status
    const statusElement = document.getElementById('statusValue');
    statusElement.className = 'text-lg font-bold text-gray-700';
    
    // Clear charts
    if (tempChart && humChart) {
        tempChart.data.labels = [];
        tempChart.data.datasets[0].data = [];
        tempChart.data.datasets[1].data = [];
        tempChart.update();
        
        humChart.data.labels = [];
        humChart.data.datasets[0].data = [];
        humChart.update();
    }
}

// Export data to CSV
function exportData() {
    if (allData.length === 0) {
        alert('No data to export');
        return;
    }
    
    let csvContent = 'Timestamp,Temperature (°C),Humidity (%),Heat Index (°C),Comfort,Status\n';
    
    allData.forEach(row => {
        csvContent += `${row.timestamp},${row.temp},${row.hum},${row.hi},"${row.comfort}","${row.status}"\n`;
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `climate_data_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

// Check Web Bluetooth API support
function checkWebBluetoothSupport() {
    if (!navigator.bluetooth) {
        alert('❌ Web Bluetooth not supported\n\nUse Chrome, Edge, or Opera browser.\nDesktop app works on any device.');
        document.getElementById('connectBtn').disabled = true;
        return false;
    }
    return true;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Arduino Climate Monitor - UNIVERSAL VERSION');
    console.log('🌍 Works with ANY HC-05 on ANY device');
    console.log('📱 Chrome/Edge recommended for best compatibility');
    
    if (checkWebBluetoothSupport()) {
        initCharts();
    }
});

// Handle page unload
window.addEventListener('beforeunload', function() {
    if (isConnected) {
        disconnectBluetooth();
    }
});


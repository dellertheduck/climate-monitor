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

// Bluetooth service UUID for HC-05 (Serial Port Profile)
const BLUETOOTH_SERVICE_UUID = '00001101-0000-1000-8000-00805f9b34fb';
const BLUETOOTH_CHARACTERISTIC_UUID = '00001142-0000-1000-8000-00805f9b34fb';

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

// Connect to Bluetooth device
async function connectBluetooth() {
    try {
        console.log('Requesting Bluetooth device...');
        
        // Request Bluetooth device
        bluetoothDevice = await navigator.bluetooth.requestDevice({
            acceptAllDevices: true,
            optionalServices: [BLUETOOTH_SERVICE_UUID]
        });

        console.log('Connecting to GATT server...');
        bluetoothServer = await bluetoothDevice.gatt.connect();

        console.log('Getting service...');
        bluetoothService = await bluetoothServer.getPrimaryService(BLUETOOTH_SERVICE_UUID);

        console.log('Getting characteristic...');
        bluetoothCharacteristic = await bluetoothService.getCharacteristic(BLUETOOTH_CHARACTERISTIC_UUID);

        // Start notifications
        await bluetoothCharacteristic.startNotifications();
        
        console.log('Notifications started');
        
        // Listen for incoming data
        bluetoothCharacteristic.addEventListener('characteristicvaluechanged', handleBluetoothData);
        
        // Update UI
        isConnected = true;
        updateConnectionStatus(true);
        
        // Listen for disconnection
        bluetoothDevice.addEventListener('gattserverdisconnected', onDisconnected);
        
    } catch (error) {
        console.error('Bluetooth connection error:', error);
        alert('Failed to connect: ' + error.message);
        updateConnectionStatus(false);
    }
}

// Handle incoming Bluetooth data
function handleBluetoothData(event) {
    const value = event.target.value;
    const decoder = new TextDecoder('utf-8');
    const data = decoder.decode(value);
    
    // Process the data (expecting JSON from Arduino)
    try {
        const jsonData = JSON.parse(data.trim());
        updateDisplay(jsonData);
    } catch (e) {
        console.log('Received data:', data);
        // Try to extract JSON from the string
        const jsonMatch = data.match(/\{.*\}/);
        if (jsonMatch) {
            try {
                const jsonData = JSON.parse(jsonMatch[0]);
                updateDisplay(jsonData);
            } catch (e2) {
                console.log('Could not parse JSON:', data);
            }
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
    
    // Keep only last 50 data points for charts
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
    
    // Update temperature & heat index chart
    tempChart.data.labels = timestamps;
    tempChart.data.datasets[0].data = temperatureData;
    tempChart.data.datasets[1].data = heatIndexData;
    tempChart.update();
    
    // Update humidity chart
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
    console.log('Bluetooth device disconnected');
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
    
    // Create CSV content
    let csvContent = 'Timestamp,Temperature (°C),Humidity (%),Heat Index (°C),Comfort,Status\n';
    
    allData.forEach(row => {
        csvContent += `${row.timestamp},${row.temp},${row.hum},${row.hi},"${row.comfort}","${row.status}"\n`;
    });
    
    // Create download link
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
        alert('Web Bluetooth API is not supported in this browser. Please use Chrome, Edge, or Opera on a device with Bluetooth capabilities.');
        document.getElementById('connectBtn').disabled = true;
        return false;
    }
    return true;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
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

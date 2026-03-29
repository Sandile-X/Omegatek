// ===== CHARTS CONFIGURATION AND DATA =====

let inventoryChart, revenueChart, categoriesChart;

// Chart.js default configuration
Chart.defaults.font.family = "'Poppins', sans-serif";
Chart.defaults.color = '#64748b';

// Initialize all charts when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(initializeCharts, 1000); // Delay for smooth loading
});

function initializeCharts() {
    initInventoryChart();
    initRevenueChart();
    initCategoriesChart();
    
    // Add intersection observer for animation
    const chartObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const chart = entry.target.querySelector('canvas');
                if (chart) {
                    animateChart(chart);
                }
            }
        });
    }, { threshold: 0.1 });
    
    document.querySelectorAll('.chart-container').forEach(container => {
        chartObserver.observe(container);
    });
}

function initInventoryChart() {
    const ctx = document.getElementById('inventoryChart');
    if (!ctx) return;
    
    const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(0, 102, 204, 0.8)');
    gradient.addColorStop(1, 'rgba(0, 153, 255, 0.1)');
    
    inventoryChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            datasets: [{
                label: 'Items in Stock',
                data: [1200, 1350, 1180, 1420, 1650, 1800, 1750, 1920, 2100, 2250, 2400, 2650],
                borderColor: '#0066cc',
                backgroundColor: gradient,
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#ffffff',
                pointBorderColor: '#0066cc',
                pointBorderWidth: 3,
                pointRadius: 6,
                pointHoverRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#ffffff',
                    bodyColor: '#ffffff',
                    borderColor: '#0066cc',
                    borderWidth: 1,
                    cornerRadius: 8,
                    displayColors: false,
                    callbacks: {
                        label: function(context) {
                            return `Items: ${context.parsed.y.toLocaleString()}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#64748b',
                        font: {
                            weight: '500'
                        }
                    }
                },
                y: {
                    grid: {
                        color: 'rgba(100, 116, 139, 0.1)'
                    },
                    ticks: {
                        color: '#64748b',
                        callback: function(value) {
                            return value.toLocaleString();
                        }
                    }
                }
            },
            animation: {
                duration: 2000,
                easing: 'easeInOutQuart'
            }
        }
    });
}

function initRevenueChart() {
    const ctx = document.getElementById('revenueChart');
    if (!ctx) return;
    
    const gradient1 = ctx.getContext('2d').createLinearGradient(0, 0, 0, 400);
    gradient1.addColorStop(0, 'rgba(0, 204, 102, 0.8)');
    gradient1.addColorStop(1, 'rgba(0, 255, 136, 0.1)');
    
    const gradient2 = ctx.getContext('2d').createLinearGradient(0, 0, 0, 400);
    gradient2.addColorStop(0, 'rgba(255, 153, 0, 0.8)');
    gradient2.addColorStop(1, 'rgba(255, 184, 77, 0.1)');
    
    revenueChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Q1 2023', 'Q2 2023', 'Q3 2023', 'Q4 2023', 'Q1 2024', 'Q2 2024'],
            datasets: [{
                label: 'TrendScan Revenue',
                data: [45000, 62000, 78000, 95000, 125000, 158000],
                backgroundColor: gradient1,
                borderColor: '#00cc66',
                borderWidth: 2,
                borderRadius: 8,
                borderSkipped: false
            }, {
                label: 'Traditional Systems',
                data: [38000, 42000, 45000, 48000, 46000, 44000],
                backgroundColor: gradient2,
                borderColor: '#ff9900',
                borderWidth: 2,
                borderRadius: 8,
                borderSkipped: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 20,
                        color: '#64748b',
                        font: {
                            weight: '600'
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#ffffff',
                    bodyColor: '#ffffff',
                    borderColor: '#0066cc',
                    borderWidth: 1,
                    cornerRadius: 8,
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: R ${context.parsed.y.toLocaleString()}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#64748b',
                        font: {
                            weight: '500'
                        }
                    }
                },
                y: {
                    grid: {
                        color: 'rgba(100, 116, 139, 0.1)'
                    },
                    ticks: {
                        color: '#64748b',
                        callback: function(value) {
                            return 'R ' + (value / 1000) + 'K';
                        }
                    }
                }
            },
            animation: {
                duration: 2000,
                easing: 'easeInOutQuart'
            }
        }
    });
}

function initCategoriesChart() {
    const ctx = document.getElementById('categoriesChart');
    if (!ctx) return;
    
    categoriesChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Electronics', 'Clothing', 'Food & Beverage', 'Automotive', 'Home & Garden', 'Sports', 'Books'],
            datasets: [{
                data: [35, 20, 15, 12, 8, 6, 4],
                backgroundColor: [
                    '#0066cc',
                    '#00cc66',
                    '#ff9900',
                    '#ff3366',
                    '#8b5cf6',
                    '#06d6a0',
                    '#ffd700'
                ],
                borderWidth: 3,
                borderColor: '#ffffff',
                hoverBorderWidth: 4,
                hoverOffset: 10
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        usePointStyle: true,
                        padding: 15,
                        color: '#64748b',
                        font: {
                            weight: '500'
                        },
                        generateLabels: function(chart) {
                            const data = chart.data;
                            const labels = data.labels;
                            const dataset = data.datasets[0];
                            
                            return labels.map((label, i) => ({
                                text: `${label} (${dataset.data[i]}%)`,
                                fillStyle: dataset.backgroundColor[i],
                                strokeStyle: dataset.backgroundColor[i],
                                pointStyle: 'circle'
                            }));
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#ffffff',
                    bodyColor: '#ffffff',
                    borderColor: '#0066cc',
                    borderWidth: 1,
                    cornerRadius: 8,
                    callbacks: {
                        label: function(context) {
                            return `${context.label}: ${context.parsed}%`;
                        }
                    }
                }
            },
            animation: {
                animateRotate: true,
                animateScale: true,
                duration: 2000,
                easing: 'easeInOutQuart'
            }
        }
    });
}

function animateChart(canvas) {
    canvas.style.opacity = '0';
    canvas.style.transform = 'translateY(30px)';
    canvas.style.transition = 'all 0.6s ease';
    
    setTimeout(() => {
        canvas.style.opacity = '1';
        canvas.style.transform = 'translateY(0)';
    }, 100);
}

// Real-time data simulation
function updateChartData() {
    if (!inventoryChart || !revenueChart) return;
    
    // Update inventory chart with new data point
    const currentMonth = new Date().getMonth();
    const inventoryData = inventoryChart.data.datasets[0].data;
    const lastValue = inventoryData[inventoryData.length - 1];
    const newValue = lastValue + (Math.random() * 200 - 100); // Random fluctuation
    
    inventoryData.push(Math.max(0, Math.round(newValue)));
    inventoryChart.data.labels.push(getMonthName(currentMonth + 1));
    
    // Keep only last 12 months
    if (inventoryData.length > 12) {
        inventoryData.shift();
        inventoryChart.data.labels.shift();
    }
    
    inventoryChart.update('active');
}

function getMonthName(month) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                   'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[month % 12];
}

// Performance analytics data
const performanceMetrics = {
    accuracy: {
        current: 98.5,
        trend: 'up',
        change: 2.3
    },
    timeSaved: {
        current: 45,
        trend: 'up',
        change: 12
    },
    roi: {
        current: 2.3,
        trend: 'up',
        change: 0.7
    },
    uptime: {
        current: 99.8,
        trend: 'stable',
        change: 0.1
    }
};

// Business intelligence calculations
function calculateBusinessMetrics() {
    const totalItems = 2650;
    const monthlyGrowth = 8.5;
    const averageOrderValue = 850;
    const customerRetention = 94.2;
    
    return {
        totalItems,
        monthlyGrowth,
        averageOrderValue,
        customerRetention,
        projectedAnnualSavings: totalItems * 2.5 * 12, // R 2.50 per item per month
        efficiencyGain: Math.round((45 / 100) * 40 * 22 * 12), // 45% time saved on 40 hour work week
        roiPercentage: ((158000 - 49999) / 49999 * 100).toFixed(1)
    };
}

// Export chart data for reporting
function exportChartData() {
    const data = {
        inventory: inventoryChart ? inventoryChart.data : null,
        revenue: revenueChart ? revenueChart.data : null,
        categories: categoriesChart ? categoriesChart.data : null,
        metrics: performanceMetrics,
        business: calculateBusinessMetrics(),
        exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { 
        type: 'application/json' 
    });
    
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `trendscan-analytics-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    window.URL.revokeObjectURL(url);
}

// Auto-update charts every 30 seconds (for demo purposes)
setInterval(updateChartData, 30000);

// Export functions for global use
window.exportChartData = exportChartData;
window.calculateBusinessMetrics = calculateBusinessMetrics;
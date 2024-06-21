window.addEventListener('load', function() {
  // Création du graphique des statistiques des patients
  const ctx = document.getElementById('patientChart').getContext('2d');
  const patientChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'juillet'],
      datasets: [{
        label: 'Nombre de patients',
        data: [120, 80, 100, 90, 110, 70, 78],
        backgroundColor: '#58a8c9',
        borderColor: '#2c3e50',
        borderWidth: 0.5
      }]
    },
    options: {
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
});

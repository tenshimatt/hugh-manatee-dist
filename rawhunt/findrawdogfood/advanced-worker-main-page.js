        // Event listeners
        document.getElementById('searchInput').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') search();
        });
        document.getElementById('searchBtn').addEventListener('click', search);
        document.getElementById('findNearbyBtn').addEventListener('click', findNearbySuppliers);
        
        document.getElementById('radiusSlider').addEventListener('input', function(e) {
            currentRadius = parseInt(e.target.value);
            document.getElementById('radiusValue').textContent = currentRadius;
        });
        
        document.getElementById('sortSelect').addEventListener('change', function(e) {
            currentSort = e.target.value;
            if (suppliersData.length > 0) {
                search(); // Re-run current search with new sort
            }
        });

        // Initialize on page load
        window.addEventListener('load', async () => {
            await getUserLocation();
            await loadCategories();
            
            // Auto-load nearby suppliers after a short delay
            setTimeout(() => {
                findNearbySuppliers();
            }, 1000);
        });
    </script>
</body>
</html>`;
}
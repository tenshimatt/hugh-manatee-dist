export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatDateTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatPawsAmount = (amount) => {
  return new Intl.NumberFormat('en-US').format(amount);
};

export const calculateAge = (birthDate) => {
  const birth = new Date(birthDate);
  const today = new Date();
  const ageInMilliseconds = today - birth;
  const ageInYears = ageInMilliseconds / (1000 * 60 * 60 * 24 * 365.25);
  
  if (ageInYears < 1) {
    const ageInMonths = Math.floor(ageInYears * 12);
    return `${ageInMonths} ${ageInMonths === 1 ? 'month' : 'months'}`;
  } else {
    const years = Math.floor(ageInYears);
    return `${years} ${years === 1 ? 'year' : 'years'}`;
  }
};

export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validatePassword = (password) => {
  return password.length >= 8;
};

export const capitalizeFirst = (str) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const truncateAddress = (address) => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const getInitials = (name) => {
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .join('')
    .slice(0, 2);
};

export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export const isEmergencySymptom = (text) => {
  const emergencyKeywords = [
    'emergency', 'urgent', 'bleeding', 'poisoned', 'choking',
    'unconscious', 'seizure', 'difficulty breathing', 'hit by car',
    'severe pain', 'collapsed', 'not responding'
  ];
  
  const lowerText = text.toLowerCase();
  return emergencyKeywords.some(keyword => lowerText.includes(keyword));
};

export const getHealthStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'excellent':
      return 'text-green-600 bg-green-100';
    case 'good':
      return 'text-blue-600 bg-blue-100';
    case 'fair':
      return 'text-yellow-600 bg-yellow-100';
    case 'poor':
      return 'text-red-600 bg-red-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
};

export const getPetTypeIcon = (petType) => {
  const icons = {
    dog: '🐕',
    cat: '🐱',
    bird: '🐦',
    fish: '🐠',
    rabbit: '🐰',
    hamster: '🐹',
    other: '🐾'
  };
  return icons[petType?.toLowerCase()] || icons.other;
};
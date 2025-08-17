import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { usePets } from '../hooks/usePets';
import {
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  CameraIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../components/LoadingSpinner';
import { aiMedicalService } from '../services/api';
import { formatDateTime, isEmergencySymptom, getPetTypeIcon } from '../utils/helpers';

const AIMedicalPage = () => {
  const [searchParams] = useSearchParams();
  const selectedPetId = searchParams.get('pet');
  
  const { pets, isLoading: petsLoading } = usePets();
  
  const [selectedPet, setSelectedPet] = useState(null);
  const [consultationHistory, setConsultationHistory] = useState([]);
  const [currentChat, setCurrentChat] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [showEmergencyWarning, setShowEmergencyWarning] = useState(false);
  
  const chatContainerRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (pets.length > 0) {
      const pet = selectedPetId 
        ? pets.find(p => p.pet_id === parseInt(selectedPetId))
        : pets[0];
      
      if (pet) {
        setSelectedPet(pet);
        loadConsultationHistory(pet.pet_id);
      }
    }
  }, [pets, selectedPetId]);

  useEffect(() => {
    // Scroll to bottom when new messages are added
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [currentChat]);

  useEffect(() => {
    // Check for emergency keywords
    if (inputMessage && isEmergencySymptom(inputMessage)) {
      setShowEmergencyWarning(true);
    } else {
      setShowEmergencyWarning(false);
    }
  }, [inputMessage]);

  const loadConsultationHistory = async (petId) => {
    try {
      const history = await aiMedicalService.getConsultationHistory(petId);
      setConsultationHistory(history.consultations || []);
    } catch (error) {
      console.error('Error loading consultation history:', error);
      setConsultationHistory([]);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !selectedPet) return;

    const userMessage = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString(),
      image: imageFile,
    };

    setCurrentChat(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const consultationData = {
        pet_id: selectedPet.pet_id,
        symptoms: inputMessage,
        image_data: imageFile ? await fileToBase64(imageFile) : null,
        consultation_type: isEmergencySymptom(inputMessage) ? 'emergency' : 'general',
      };

      const response = await aiMedicalService.getConsultation(consultationData);
      
      const aiMessage = {
        role: 'assistant',
        content: response.advice || 'I apologize, but I encountered an issue processing your request. Please try again.',
        timestamp: new Date().toISOString(),
        confidence: response.confidence,
        emergency_level: response.emergency_level,
        recommendations: response.recommendations,
      };

      setCurrentChat(prev => [...prev, aiMessage]);
      
      // Reload consultation history
      loadConsultationHistory(selectedPet.pet_id);

    } catch (error) {
      console.error('Error getting AI consultation:', error);
      
      const errorMessage = {
        role: 'assistant',
        content: 'I apologize, but I\'m currently unable to provide medical advice. If this is an emergency, please contact your veterinarian immediately.',
        timestamp: new Date().toISOString(),
        isError: true,
      };

      setCurrentChat(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setInputMessage('');
      setImageFile(null);
      setShowEmergencyWarning(false);
    }
  };

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
    }
  };

  const startNewConsultation = () => {
    setCurrentChat([{
      role: 'assistant',
      content: `Hello! I'm here to help with ${selectedPet?.name}'s health concerns. Please describe the symptoms you've noticed, and I'll do my best to provide guidance. 

⚠️ **Important**: For emergencies, contact your veterinarian immediately. This AI consultation is for informational purposes only and doesn't replace professional veterinary care.`,
      timestamp: new Date().toISOString(),
    }]);
  };

  if (petsLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (pets.length === 0) {
    return (
      <div className="text-center py-16">
        <ChatBubbleLeftRightIcon className="w-16 h-16 text-gray-400 mx-auto mb-6" />
        <h3 className="text-xl font-medium text-gray-900 mb-2">No pets found</h3>
        <p className="text-gray-600 mb-6">You need to add a pet first before getting AI health consultations.</p>
        <a href="/pets/add" className="btn-primary">
          Add Your First Pet
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Health Consultant</h1>
          <p className="text-gray-600 mt-1">
            Get instant AI-powered health guidance for your pets
          </p>
        </div>
      </div>

      {/* Emergency Warning */}
      {showEmergencyWarning && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <ExclamationTriangleIcon className="w-6 h-6 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-800 mb-1">Emergency Detected</h3>
              <p className="text-red-700 text-sm mb-2">
                Your message suggests this might be an emergency. If your pet is in distress, please contact your veterinarian immediately.
              </p>
              <div className="text-sm text-red-600">
                <strong>Emergency contacts:</strong>
                <ul className="list-disc list-inside mt-1">
                  <li>Your local veterinarian</li>
                  <li>24/7 Animal Emergency Hospital</li>
                  <li>Pet Poison Control: (888) 426-4435</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat Interface */}
        <div className="lg:col-span-2">
          <div className="card p-0 h-[600px] flex flex-col">
            {/* Pet Selector Header */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <select
                  className="input-field flex-1"
                  value={selectedPet?.pet_id || ''}
                  onChange={(e) => {
                    const pet = pets.find(p => p.pet_id === parseInt(e.target.value));
                    setSelectedPet(pet);
                    setCurrentChat([]);
                    if (pet) loadConsultationHistory(pet.pet_id);
                  }}
                >
                  {pets.map((pet) => (
                    <option key={pet.pet_id} value={pet.pet_id}>
                      {pet.name} ({pet.breed})
                    </option>
                  ))}
                </select>
                {currentChat.length === 0 && (
                  <button
                    onClick={startNewConsultation}
                    className="btn-primary"
                  >
                    Start Consultation
                  </button>
                )}
              </div>
            </div>

            {/* Chat Messages */}
            <div 
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto p-4 space-y-4"
            >
              {currentChat.length === 0 ? (
                <div className="text-center py-16">
                  <ChatBubbleLeftRightIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Ready to help {selectedPet?.name}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Start a new consultation to get AI-powered health advice
                  </p>
                  <button
                    onClick={startNewConsultation}
                    className="btn-primary"
                  >
                    Start New Consultation
                  </button>
                </div>
              ) : (
                currentChat.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.role === 'user'
                          ? 'bg-primary-500 text-white'
                          : message.isError
                          ? 'bg-red-100 text-red-800 border border-red-200'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      
                      {message.image && (
                        <img
                          src={URL.createObjectURL(message.image)}
                          alt="Uploaded"
                          className="mt-2 max-w-full h-auto rounded"
                        />
                      )}
                      
                      {message.recommendations && (
                        <div className="mt-2 text-xs">
                          <strong>Recommendations:</strong>
                          <ul className="list-disc list-inside mt-1">
                            {message.recommendations.map((rec, i) => (
                              <li key={i}>{rec}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {message.emergency_level && message.emergency_level !== 'low' && (
                        <div className={`mt-2 text-xs px-2 py-1 rounded ${
                          message.emergency_level === 'high' 
                            ? 'bg-red-200 text-red-800'
                            : 'bg-yellow-200 text-yellow-800'
                        }`}>
                          Emergency Level: {message.emergency_level.toUpperCase()}
                        </div>
                      )}
                      
                      <p className="text-xs opacity-75 mt-1">
                        {formatDateTime(message.timestamp)}
                      </p>
                    </div>
                  </div>
                ))
              )}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 text-gray-900 px-4 py-2 rounded-lg">
                    <LoadingSpinner size="sm" />
                    <span className="ml-2 text-sm">AI is thinking...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            {currentChat.length > 0 && (
              <div className="p-4 border-t border-gray-200">
                <div className="flex space-x-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                    title="Upload image"
                  >
                    <CameraIcon className="w-5 h-5" />
                  </button>
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Describe the symptoms or ask a question..."
                    className="flex-1 input-field"
                    disabled={isLoading}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() || isLoading}
                    className="btn-primary p-2 disabled:opacity-50"
                  >
                    <PaperAirplaneIcon className="w-5 h-5" />
                  </button>
                </div>
                
                {imageFile && (
                  <div className="mt-2 flex items-center space-x-2 text-sm text-gray-600">
                    <CameraIcon className="w-4 h-4" />
                    <span>Image selected: {imageFile.name}</span>
                    <button
                      onClick={() => setImageFile(null)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Pet Info */}
          {selectedPet && (
            <div className="card p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="text-3xl">{getPetTypeIcon(selectedPet.pet_type)}</div>
                <div>
                  <h3 className="font-semibold text-gray-900">{selectedPet.name}</h3>
                  <p className="text-sm text-gray-600">{selectedPet.breed}</p>
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Age:</span>
                  <span>{selectedPet.birth_date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Weight:</span>
                  <span>{selectedPet.weight ? `${selectedPet.weight} kg` : 'Not set'}</span>
                </div>
              </div>

              {selectedPet.medical_conditions && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-2">Medical Conditions</h4>
                  <p className="text-sm text-gray-600">{selectedPet.medical_conditions}</p>
                </div>
              )}
            </div>
          )}

          {/* Recent Consultations */}
          <div className="card p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Recent Consultations</h3>
            
            {consultationHistory.length === 0 ? (
              <p className="text-gray-600 text-sm">No previous consultations</p>
            ) : (
              <div className="space-y-3">
                {consultationHistory.slice(0, 5).map((consultation, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm text-gray-900 font-medium mb-1">
                          {consultation.symptoms?.slice(0, 50)}...
                        </p>
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <ClockIcon className="w-3 h-3" />
                          <span>{formatDateTime(consultation.consultation_time)}</span>
                        </div>
                      </div>
                      {consultation.emergency_level !== 'low' && (
                        <span className={`text-xs px-2 py-1 rounded ${
                          consultation.emergency_level === 'high' 
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {consultation.emergency_level}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Tips */}
          <div className="card p-6">
            <h3 className="font-semibold text-gray-900 mb-4">💡 Quick Tips</h3>
            <div className="space-y-3 text-sm">
              <div>
                <h4 className="font-medium text-gray-900">Be Specific</h4>
                <p className="text-gray-600">Describe symptoms in detail including duration and severity</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Include Photos</h4>
                <p className="text-gray-600">Upload clear photos of any visible issues</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Emergency Signs</h4>
                <p className="text-gray-600">Contact vet immediately for breathing issues, bleeding, or collapse</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIMedicalPage;
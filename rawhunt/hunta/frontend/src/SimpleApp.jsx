import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { CheckCircle2, MapPin, Trophy, Zap, BookOpen, Camera, Dog, Loader2, AlertCircle } from 'lucide-react';

function SimpleApp() {
  const [apiStatus, setApiStatus] = useState('Testing...');
  const [apiData, setApiData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    testAPILoad();
  }, []);

  const testAPILoad = async () => {
    try {
      const response = await fetch('https://hunta-backend-prod.findrawdogfood.workers.dev/api/dogs/list');
      if (response.ok) {
        const data = await response.json();
        setApiStatus('API Connected - ' + data.data.length + ' dogs loaded');
        setApiData(data.data);
      } else {
        setApiStatus('API Error: ' + response.status);
      }
    } catch (error) {
      setApiStatus('API Failed: ' + error.message);
    }
  };

  const testAPI = async () => {
    setIsLoading(true);
    try {
      console.log('Testing API...');
      const response = await fetch('https://hunta-backend-prod.findrawdogfood.workers.dev/api/dogs/list', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('API Response:', data);
      setApiData(data.data);
      setApiStatus('API working! Found ' + data.data.length + ' dogs');
    } catch (error) {
      console.error('API Error:', error);
      setApiStatus('API Error: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    { icon: Dog, title: 'Pack & Profile Management', color: 'text-green-600' },
    { icon: MapPin, title: 'Hunt Route Planner with GPS', color: 'text-blue-600' },
    { icon: Trophy, title: 'Trial & Event Listings', color: 'text-yellow-600' },
    { icon: Zap, title: 'Gear Reviews & Loadouts', color: 'text-purple-600' },
    { icon: BookOpen, title: 'Ethics Knowledge Base', color: 'text-indigo-600' },
    { icon: Camera, title: 'Brag Board & Journal', color: 'text-pink-600' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <Card className="border-0 shadow-xl bg-gradient-to-r from-green-800 to-green-600 text-white">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-4xl font-bold flex items-center justify-center gap-2">
              <Dog className="h-10 w-10" />
              HUNTA
            </CardTitle>
            <CardDescription className="text-green-100 text-lg">
              Elite Dog Hunting Platform
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Badge className="bg-green-400 text-green-900 hover:bg-green-300">
              <CheckCircle2 className="h-4 w-4 mr-1" />
              REACT APP LOADING SUCCESSFULLY
            </Badge>
          </CardContent>
        </Card>

        {/* Core Features */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-gray-800">Core Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div key={index} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <Icon className={`h-6 w-6 ${feature.color}`} />
                    <span className="text-gray-700 font-medium">{feature.title}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* API Test Section */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-gray-800">Backend Connection</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center">
              <Button 
                onClick={testAPI}
                disabled={isLoading}
                size="lg"
                className="bg-green-700 hover:bg-green-800"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Testing...
                  </>
                ) : (
                  'Test Backend API'
                )}
              </Button>
            </div>
            
            <Separator />
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 font-medium">Frontend:</span>
                <Badge variant="outline" className="text-green-600 border-green-600">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  React App Running
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 font-medium">Backend:</span>
                <span className="text-gray-700 text-xs font-mono">hunta-backend-prod.findrawdogfood.workers.dev</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-medium">API Status:</span>
                <Badge 
                  variant={apiStatus.includes('Connected') ? 'default' : apiStatus.includes('Error') ? 'destructive' : 'secondary'}
                  className="ml-2"
                >
                  {apiStatus.includes('Error') && <AlertCircle className="h-3 w-3 mr-1" />}
                  {apiStatus.includes('Connected') && <CheckCircle2 className="h-3 w-3 mr-1" />}
                  {apiStatus}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* API Data Display */}
        {apiData && (
          <Card className="shadow-lg border-green-200">
            <CardHeader className="bg-gradient-to-r from-green-50 to-green-100">
              <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Dog className="h-6 w-6 text-green-600" />
                Live API Data - {apiData.length} Dogs
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {apiData.map(dog => (
                  <Card key={dog.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-12 w-12 bg-green-100">
                          <AvatarFallback className="bg-green-600 text-white">
                            {dog.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-gray-900">{dog.name}</h4>
                            <Badge variant="outline" className="text-xs">
                              Level: {dog.training_level}
                            </Badge>
                          </div>
                          <div className="flex gap-2 text-sm text-gray-600">
                            <span>{dog.breed}</span>
                            <span>•</span>
                            <span>Age: {dog.age}</span>
                          </div>
                          <p className="text-sm text-gray-500 mt-2">{dog.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default SimpleApp;
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getThemeColors, getGradients } from '@/constants/Colors';
import { GlassCard } from '@/components/GlassCard';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/contexts/ThemeContext';
import { router } from 'expo-router';
import { useImageAnalysis } from '@fastshot/ai';
import * as Location from 'expo-location';

interface Alternative {
  product: string;
  savings: string;
  location: string;
}

export default function SmartShopperScreen() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [productDescription, setProductDescription] = useState('');
  const [alternatives, setAlternatives] = useState<Alternative[]>([]);
  const [location, setLocation] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const { theme } = useTheme();
  const Colors = getThemeColors(theme === 'dark');
  const Gradients = getGradients(theme === 'dark');
  const { analyzeImage, data, isLoading: isAILoading } = useImageAnalysis();

  const requestPermissions = async () => {
    const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
    const locationStatus = await Location.requestForegroundPermissionsAsync();

    if (cameraStatus.status !== 'granted' || locationStatus.status !== 'granted') {
      Alert.alert(
        'Permissions Required',
        'Camera and location permissions are needed for Smart Shopper.'
      );
      return false;
    }
    return true;
  };

  const getUserLocation = async () => {
    try {
      const loc = await Location.getCurrentPositionAsync({});
      const address = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });

      if (address && address.length > 0) {
        const city = address[0].city || address[0].subregion || 'Unknown';
        setLocation(city);
        return city;
      }
    } catch (error) {
      console.error('Failed to get location:', error);
    }
    return '';
  };

  const handleTakePhoto = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
      await getUserLocation();
    }
  };

  const handlePickImage = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
      await getUserLocation();
    }
  };

  const handleAnalyze = async () => {
    if (!selectedImage) {
      Alert.alert('No Image', 'Please take or select a product photo first.');
      return;
    }

    if (!productDescription.trim()) {
      Alert.alert('Description Required', 'Please add a short product description.');
      return;
    }

    try {
      setIsAnalyzing(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      const prompt = `Analyze this product image and the description: "${productDescription}".

      Provide:
      1. Product identification and brand
      2. Three generic or store-brand alternatives that are cheaper
      3. Estimated price savings for each alternative
      4. Suggested stores or online retailers (prefer those near ${location || 'the user'})

      Format as a structured list of alternatives with product name, estimated savings, and where to find it.`;

      await analyzeImage({
        imageUrl: selectedImage,
        prompt,
      });

      // Parse AI response into alternatives
      if (data) {
        const parsed = parseAlternatives(data);
        setAlternatives(parsed);
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Analysis failed:', error);
      Alert.alert('Analysis Failed', 'Unable to analyze the product. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const parseAlternatives = (aiResponse: string): Alternative[] => {
    // Simple parser - in production, this would be more sophisticated
    const alternatives: Alternative[] = [];

    try {
      const lines = aiResponse.split('\n').filter(line => line.trim());
      let currentAlternative: Partial<Alternative> = {};

      lines.forEach((line) => {
        if (line.toLowerCase().includes('alternative') || line.match(/^\d+\./)) {
          if (currentAlternative.product) {
            alternatives.push(currentAlternative as Alternative);
          }
          currentAlternative = { product: line.replace(/^\d+\./, '').trim() };
        } else if (line.toLowerCase().includes('save') || line.includes('£') || line.includes('$')) {
          currentAlternative.savings = line.trim();
        } else if (line.toLowerCase().includes('store') || line.toLowerCase().includes('retailer')) {
          currentAlternative.location = line.trim();
        }
      });

      if (currentAlternative.product) {
        alternatives.push(currentAlternative as Alternative);
      }

      // Fallback if parsing fails
      if (alternatives.length === 0) {
        return [
          {
            product: 'Store Brand Alternative',
            savings: 'Save up to 30%',
            location: 'Local supermarkets',
          },
          {
            product: 'Generic Brand',
            savings: 'Save up to 40%',
            location: 'Discount stores',
          },
          {
            product: 'Bulk Purchase Option',
            savings: 'Save up to 25%',
            location: 'Warehouse clubs',
          },
        ];
      }
    } catch (error) {
      console.error('Failed to parse alternatives:', error);
    }

    return alternatives.slice(0, 3);
  };

  const calculateMonthlySavings = () => {
    if (alternatives.length === 0) return 0;

    // Extract estimated savings and calculate monthly
    const avgSavingsPerPurchase = 5; // Placeholder
    const purchasesPerMonth = 4;
    return avgSavingsPerPurchase * purchasesPerMonth;
  };

  return (
    <LinearGradient colors={Gradients.background} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: Colors.white, borderColor: Colors.glassBorder }]}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.primaryText} />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={[styles.title, { color: Colors.primaryText }]}>Smart Shopper</Text>
            <Text style={[styles.subtitle, { color: Colors.electricTeal }]}>Find Cheaper Alternatives</Text>
          </View>
        </View>

        {/* Camera Section */}
        {!selectedImage ? (
          <GlassCard style={styles.cameraCard}>
            <View style={styles.cameraPlaceholder}>
              <LinearGradient
                colors={[Colors.amethyst, Colors.electricTeal]}
                style={styles.cameraIconContainer}
              >
                <Ionicons name="camera" size={64} color={Colors.white} />
              </LinearGradient>
              <Text style={[styles.cameraText, { color: Colors.primaryText }]}>
                Capture or upload a product photo
              </Text>
              <View style={styles.cameraButtons}>
                <TouchableOpacity
                  style={[styles.cameraButton, { backgroundColor: Colors.electricTeal }]}
                  onPress={handleTakePhoto}
                >
                  <Ionicons name="camera" size={24} color={Colors.white} />
                  <Text style={styles.cameraButtonText}>Take Photo</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.cameraButton, { backgroundColor: Colors.vibrantPurple }]}
                  onPress={handlePickImage}
                >
                  <Ionicons name="images" size={24} color={Colors.white} />
                  <Text style={styles.cameraButtonText}>Choose Photo</Text>
                </TouchableOpacity>
              </View>
            </View>
          </GlassCard>
        ) : (
          <>
            {/* Product Image */}
            <GlassCard style={styles.imageCard}>
              <Image source={{ uri: selectedImage }} style={styles.productImage} />
              <TouchableOpacity
                style={[styles.retakeButton, { backgroundColor: Colors.radiantMagenta }]}
                onPress={() => {
                  setSelectedImage(null);
                  setAlternatives([]);
                  setProductDescription('');
                }}
              >
                <Ionicons name="refresh" size={20} color={Colors.white} />
                <Text style={styles.retakeButtonText}>Retake</Text>
              </TouchableOpacity>
            </GlassCard>

            {/* Product Description Input */}
            <GlassCard style={styles.descriptionCard}>
              <Text style={[styles.label, { color: Colors.primaryText }]}>Product Description</Text>
              <TextInput
                style={[styles.descriptionInput, {
                  backgroundColor: Colors.lightCream,
                  borderColor: Colors.glassBorder,
                  color: Colors.primaryText,
                }]}
                placeholder="e.g., Organic pasta, 500g"
                placeholderTextColor={Colors.mediumGray}
                value={productDescription}
                onChangeText={setProductDescription}
                multiline
              />
            </GlassCard>

            {/* Analyze Button */}
            {!alternatives.length && (
              <TouchableOpacity
                style={styles.analyzeButton}
                onPress={handleAnalyze}
                disabled={isAnalyzing || isAILoading}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[Colors.amethyst, Colors.electricTeal]}
                  style={styles.analyzeButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {isAnalyzing || isAILoading ? (
                    <>
                      <ActivityIndicator size="small" color={Colors.white} />
                      <Text style={styles.analyzeButtonText}>Analyzing... (5-10 seconds)</Text>
                    </>
                  ) : (
                    <>
                      <Ionicons name="scan" size={24} color={Colors.white} />
                      <Text style={styles.analyzeButtonText}>Find Alternatives</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            )}

            {/* Alternatives List */}
            {alternatives.length > 0 && (
              <>
                <View style={styles.alternativesHeader}>
                  <Text style={[styles.sectionTitle, { color: Colors.primaryText }]}>
                    Cheaper Alternatives Found
                  </Text>
                  <View style={[styles.savingsBadge, { backgroundColor: Colors.glowingGreen }]}>
                    <Text style={styles.savingsBadgeText}>
                      Save £{calculateMonthlySavings()}/mo
                    </Text>
                  </View>
                </View>

                {alternatives.map((alt, index) => (
                  <GlassCard key={index} style={styles.alternativeCard}>
                    <View style={styles.alternativeHeader}>
                      <View style={[styles.alternativeNumber, { backgroundColor: Colors.electricTeal }]}>
                        <Text style={styles.alternativeNumberText}>{index + 1}</Text>
                      </View>
                      <View style={styles.alternativeInfo}>
                        <Text style={[styles.alternativeProduct, { color: Colors.primaryText }]}>
                          {alt.product}
                        </Text>
                        <Text style={[styles.alternativeSavings, { color: Colors.glowingGreen }]}>
                          {alt.savings}
                        </Text>
                        <View style={styles.alternativeLocation}>
                          <Ionicons name="location" size={14} color={Colors.secondaryText} />
                          <Text style={[styles.alternativeLocationText, { color: Colors.secondaryText }]}>
                            {alt.location}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </GlassCard>
                ))}

                {/* New Scan Button */}
                <TouchableOpacity
                  style={[styles.newScanButton, { backgroundColor: Colors.vibrantPurple }]}
                  onPress={() => {
                    setSelectedImage(null);
                    setAlternatives([]);
                    setProductDescription('');
                  }}
                >
                  <Ionicons name="add-circle" size={24} color={Colors.white} />
                  <Text style={styles.newScanButtonText}>Scan Another Product</Text>
                </TouchableOpacity>
              </>
            )}
          </>
        )}

        {/* Info Card */}
        <GlassCard style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Ionicons name="information-circle" size={24} color={Colors.electricTeal} />
            <Text style={[styles.infoTitle, { color: Colors.primaryText }]}>How It Works</Text>
          </View>
          <Text style={[styles.infoText, { color: Colors.secondaryText }]}>
            1. Take or upload a product photo{'\n'}
            2. Add a short description{'\n'}
            3. AI analyzes and finds cheaper alternatives{'\n'}
            4. Get store recommendations near you
          </Text>
        </GlassCard>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 16,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
    fontWeight: '600',
  },
  cameraCard: {
    marginBottom: 20,
  },
  cameraPlaceholder: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  cameraIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  cameraText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 24,
    textAlign: 'center',
  },
  cameraButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cameraButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 16,
  },
  cameraButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  imageCard: {
    marginBottom: 20,
  },
  productImage: {
    width: '100%',
    height: 250,
    borderRadius: 16,
    marginBottom: 12,
  },
  retakeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retakeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  descriptionCard: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  descriptionInput: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  analyzeButton: {
    marginBottom: 24,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#A855F7',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  analyzeButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 18,
  },
  analyzeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  alternativesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  savingsBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  savingsBadgeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  alternativeCard: {
    marginBottom: 12,
  },
  alternativeHeader: {
    flexDirection: 'row',
    gap: 12,
  },
  alternativeNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alternativeNumberText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  alternativeInfo: {
    flex: 1,
  },
  alternativeProduct: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  alternativeSavings: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  alternativeLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  alternativeLocationText: {
    fontSize: 12,
    fontWeight: '500',
  },
  newScanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 12,
    marginBottom: 20,
  },
  newScanButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  infoCard: {
    marginBottom: 20,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  infoText: {
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '500',
  },
});

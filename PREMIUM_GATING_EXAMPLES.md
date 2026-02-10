# Premium Feature Gating Examples

## Quick Start

Use the `usePremiumFeature` hook to gate any feature:

```tsx
import { usePremiumFeature } from '@/hooks/usePremiumFeature';

function MyComponent() {
  const { requirePremium, isPremium } = usePremiumFeature();

  const handlePremiumAction = () => {
    // This will show paywall if user is not premium
    if (!requirePremium()) return;

    // Execute premium feature
    doSomethingPremium();
  };

  return (
    <Button onPress={handlePremiumAction}>
      Premium Action
    </Button>
  );
}
```

## Examples

### 1. Gate Entire Screen

```tsx
import { usePremiumFeature } from '@/hooks/usePremiumFeature';
import { Redirect } from 'expo-router';

export default function PremiumScreen() {
  const { isPremium } = usePremiumFeature();

  // Redirect to paywall if not premium
  if (!isPremium) {
    return <PremiumUpsell />;
  }

  return <PremiumContent />;
}
```

### 2. Gate Button Actions

```tsx
function SmartShopperButton() {
  const { requirePremium } = usePremiumFeature();
  const router = useRouter();

  const handlePress = () => {
    if (!requirePremium()) return;
    router.push('/smart-shopper');
  };

  return (
    <PressableScale onPress={handlePress}>
      <Text>Smart Shopper 🛒</Text>
    </PressableScale>
  );
}
```

### 3. Conditional Rendering

```tsx
function AdvancedFeatures() {
  const { isPremium } = usePremiumFeature();

  return (
    <View>
      {/* Always visible */}
      <BasicFeature />

      {/* Only for premium users */}
      {isPremium && <AdvancedAnalytics />}
      {isPremium && <CustomReports />}

      {/* Show upgrade prompt for non-premium */}
      {!isPremium && <UpgradePrompt />}
    </View>
  );
}
```

### 4. Feature Limit with Upsell

```tsx
function ExportButton() {
  const { isPremium, requirePremium } = usePremiumFeature();
  const [exportCount, setExportCount] = useState(0);

  const handleExport = () => {
    // Free users get 3 exports
    if (!isPremium && exportCount >= 3) {
      requirePremium(); // Shows paywall
      return;
    }

    // Execute export
    performExport();
    setExportCount(prev => prev + 1);
  };

  return (
    <View>
      <Button onPress={handleExport}>
        Export Data
      </Button>
      {!isPremium && (
        <Text>
          {3 - exportCount} exports remaining
        </Text>
      )}
    </View>
  );
}
```

### 5. AI Coach Gating (Already Implemented)

```tsx
const handleSendMessage = async (text: string) => {
  if (!text.trim() || isLoading) return;

  // Gate AI access for non-premium users
  if (!requirePremium()) return;

  // Send message to AI
  const response = await generateText(text);
  // ...
};
```

### 6. Inline Upgrade Prompts

```tsx
function SavingsHub() {
  const { isPremium, showPaywall } = usePremiumFeature();

  return (
    <ScrollView>
      {/* Free feature */}
      <SavingsTracker />

      {/* Premium feature with inline prompt */}
      <GlassCard>
        {isPremium ? (
          <AdvancedSavingsTools />
        ) : (
          <TouchableOpacity onPress={showPaywall}>
            <View style={styles.upgradePrompt}>
              <Ionicons name="lock-closed" size={24} />
              <Text>Unlock Advanced Tools</Text>
              <Text>Get Elite access for premium features</Text>
            </View>
          </TouchableOpacity>
        )}
      </GlassCard>

      {/* Free feature */}
      <SavingsTips />
    </ScrollView>
  );
}
```

### 7. Badge/Tag System

```tsx
function FeatureCard({ isPremium: featureIsPremium }: Props) {
  const { isPremium: userIsPremium, showPaywall } = usePremiumFeature();

  return (
    <Card>
      <View style={styles.header}>
        <Text>Feature Name</Text>
        {featureIsPremium && (
          <View style={styles.premiumBadge}>
            <Text>ELITE</Text>
          </View>
        )}
      </View>

      <Button
        onPress={() => {
          if (featureIsPremium && !userIsPremium) {
            showPaywall();
            return;
          }
          executeFeature();
        }}
      >
        {featureIsPremium && !userIsPremium
          ? 'Upgrade to Access'
          : 'Open Feature'
        }
      </Button>
    </Card>
  );
}
```

### 8. Tabs/Navigation Gating

```tsx
function ProfileTabs() {
  const { isPremium, showPaywall } = usePremiumFeature();
  const [activeTab, setActiveTab] = useState('overview');

  const handleTabPress = (tab: string) => {
    if (tab === 'insights' && !isPremium) {
      showPaywall();
      return;
    }
    setActiveTab(tab);
  };

  return (
    <View>
      <TabBar
        tabs={[
          { id: 'overview', label: 'Overview' },
          { id: 'insights', label: 'Insights', premium: true },
          { id: 'settings', label: 'Settings' },
        ]}
        activeTab={activeTab}
        onTabPress={handleTabPress}
      />

      {activeTab === 'overview' && <Overview />}
      {activeTab === 'insights' && isPremium && <Insights />}
      {activeTab === 'settings' && <Settings />}
    </View>
  );
}
```

### 9. Challenge Gating

```tsx
function ChallengeCard({ challenge }: Props) {
  const { isPremium, requirePremium } = usePremiumFeature();

  const handleJoinChallenge = () => {
    if (challenge.isPremium && !requirePremium()) {
      return;
    }

    joinChallenge(challenge.id);
  };

  return (
    <Card>
      <View style={styles.header}>
        <Text>{challenge.title}</Text>
        {challenge.isPremium && (
          <LinearGradient colors={['#2DD4BF', '#A855F7']}>
            <Text>ELITE</Text>
          </LinearGradient>
        )}
      </View>

      <Text>{challenge.reward}</Text>

      <Button onPress={handleJoinChallenge}>
        {challenge.isPremium && !isPremium
          ? 'Unlock Elite Challenge'
          : 'Join Challenge'
        }
      </Button>
    </Card>
  );
}
```

### 10. Smart Shopper Integration

```tsx
function SmartShopperScreen() {
  const { requirePremium, isPremium } = usePremiumFeature();

  const handleScanReceipt = () => {
    // Basic scan is free
    performBasicScan();
  };

  const handleAdvancedAnalysis = () => {
    // Advanced features require premium
    if (!requirePremium()) return;

    performAdvancedAnalysis();
  };

  return (
    <View>
      {/* Free feature */}
      <Button onPress={handleScanReceipt}>
        Scan Receipt
      </Button>

      {/* Premium feature */}
      <Button
        onPress={handleAdvancedAnalysis}
        style={!isPremium && styles.locked}
      >
        {isPremium ? 'Advanced Analysis' : 'Advanced Analysis 🔒'}
      </Button>

      {/* Show what they're missing */}
      {!isPremium && (
        <PremiumFeaturesList
          features={[
            'AI-powered price comparisons',
            'Automatic coupon finder',
            'Savings projections',
          ]}
        />
      )}
    </View>
  );
}
```

## Best Practices

### 1. **Clear Communication**
Always tell users WHY they need premium:
```tsx
<Text>Upgrade to Elite for unlimited AI coaching</Text>
// NOT: "This feature is locked"
```

### 2. **Graceful Degradation**
Provide value to free users:
```tsx
// Good: Show limited version
{isPremium ? <FullReport /> : <BasicReport />}

// Bad: Hide everything
{isPremium && <AllContent />}
```

### 3. **Contextual Prompts**
Show paywall in context:
```tsx
// When user tries to use feature
if (!requirePremium()) return;

// NOT: Random popups
```

### 4. **Visual Hierarchy**
Make premium features visually distinct:
```tsx
<LinearGradient colors={['#2DD4BF', '#A855F7']}>
  <Text>ELITE FEATURE</Text>
</LinearGradient>
```

### 5. **Haptic Feedback**
Use appropriate haptics:
```tsx
// Warning when hitting paywall
Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

// Success when premium action completes
Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
```

## Anti-Patterns to Avoid

❌ **Don't**: Hide premium status
```tsx
// Bad: User doesn't know feature is premium
<Button onPress={() => requirePremium() && action()}>
  Feature
</Button>
```

✅ **Do**: Show premium badge
```tsx
// Good: Clear visual indicator
<Button>
  Feature {!isPremium && '🔒'}
</Button>
```

❌ **Don't**: Interrupt user flow randomly
```tsx
// Bad: Random paywall after 3 screens
if (screenCount === 3) showPaywall();
```

✅ **Do**: Show paywall when user wants premium feature
```tsx
// Good: User-initiated
if (wantsAdvancedFeature && !isPremium) {
  showPaywall();
}
```

❌ **Don't**: Make free tier useless
```tsx
// Bad: Everything is locked
{isPremium ? <AllContent /> : <EmptyState />}
```

✅ **Do**: Provide value at every tier
```tsx
// Good: Useful free features
<BasicFeatures />
{isPremium && <AdvancedFeatures />}
```

## Testing

### Check Premium Status
```tsx
import { useSubscription } from '@/contexts/SubscriptionContext';

function DebugPanel() {
  const { isPremium, profile } = useSubscription();

  return (
    <View>
      <Text>Premium: {isPremium ? 'Yes' : 'No'}</Text>
      <Text>Profile: {JSON.stringify(profile, null, 2)}</Text>
    </View>
  );
}
```

### Test Gating
1. Try feature as non-premium → Should show paywall
2. Make mock purchase → Should unlock feature
3. Close and reopen app → Should maintain premium status
4. Restore purchases → Should restore premium status

## Mock Mode

In Expo Go/Web, Adapty uses mock mode:
- All products load successfully
- Purchases always succeed
- Premium access granted immediately
- No real payments processed

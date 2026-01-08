import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../../../constants';
import { useTheme } from '../../../context/ThemeContext';

interface FaqScreenProps {
  navigation: any;
}

interface FaqItem {
  id: string;
  category: string;
  question: string;
  answer: string;
  keywords: string;
}

const FaqScreen: React.FC<FaqScreenProps> = ({ navigation }) => {
  const { theme, isDarkMode } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState('all');

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'account', label: 'Account' },
    { id: 'reading', label: 'Reading' },
    { id: 'writing', label: 'Writing' },
    { id: 'earnings', label: 'Earnings' },
    { id: 'technical', label: 'Technical' },
  ];

  const faqData: FaqItem[] = [
    // Account Category
    {
      id: '1',
      category: 'account',
      question: 'How do I create an account?',
      answer: 'Click on "Sign Up" on the login screen, enter your username, email, and password, then verify your email with the code sent to you. Once verified, you can set up your profile and start reading!',
      keywords: 'account create sign up register',
    },
    {
      id: '2',
      category: 'account',
      question: 'How do I reset my password?',
      answer: 'On the login screen, click "Forgot?" next to the password field. Enter your email address, and we\'ll send you a reset link. Follow the instructions in the email to set a new password.',
      keywords: 'password reset forgot change',
    },
    {
      id: '3',
      category: 'account',
      question: 'Can I delete my account?',
      answer: 'Yes. Go to Settings → Account → Delete Account. Please note that this action is permanent and cannot be undone. All your data, including your library and reading history, will be permanently deleted.',
      keywords: 'delete account remove close',
    },
    // Reading Category
    {
      id: '4',
      category: 'reading',
      question: 'How do I add novels to my library?',
      answer: 'On any novel detail page, tap the "Library" button below the cover image. The novel will be added to your library and you can access it anytime from the Library tab in the bottom navigation.',
      keywords: 'bookmark save library add button',
    },
    {
      id: '5',
      category: 'reading',
      question: 'Why do I see ads while reading?',
      answer: 'Ads help support our writers! All novels on Mantra are free to read. When you view ads, the revenue is distributed directly to the authors whose novels you\'re reading. This keeps the platform free while fairly compensating writers.',
      keywords: 'ads advertisements why',
    },
    {
      id: '6',
      category: 'reading',
      question: 'How do I change reading settings?',
      answer: 'While reading a chapter, you\'ll see reading controls at the top. You can adjust font size, font family, line spacing, brightness, and choose between Light, Sepia, or Dark themes.',
      keywords: 'font size theme change customize settings',
    },
    {
      id: '7',
      category: 'reading',
      question: 'How do I get notified about new chapters?',
      answer: 'Add the novel to your library and enable notifications in Settings → Preferences. You\'ll receive alerts whenever a new chapter is published for novels in your library.',
      keywords: 'notifications updates new chapter',
    },
    // Writing Category
    {
      id: '8',
      category: 'writing',
      question: 'How do I publish my own novel?',
      answer: 'Go to Profile → Author Dashboard → + Novel. Fill in your novel\'s title, synopsis, select genres, and upload a cover image. Once created, you can start adding chapters. Your novel will be visible to readers immediately after publishing your first chapter.',
      keywords: 'publish write author novel create',
    },
    {
      id: '9',
      category: 'writing',
      question: 'Can I edit chapters after publishing?',
      answer: 'Yes! Go to Author Dashboard → Your Novel → Edit, then select the chapter you want to edit. Make your changes and save. Readers will see the updated version immediately.',
      keywords: 'edit chapter update change',
    },
    {
      id: '10',
      category: 'writing',
      question: 'What are the cover image requirements?',
      answer: 'Cover images should be at least 800x1200 pixels (2:3 ratio), under 5MB, in JPG or PNG format. The image must be appropriate and not infringe on any copyrights.',
      keywords: 'cover image guidelines requirements',
    },
    // Earnings Category
    {
      id: '11',
      category: 'earnings',
      question: 'How do authors earn money on Mantra?',
      answer: 'Authors earn when readers view ads while reading their novels. All ad revenue is distributed among writers based on how many ads readers watch on their content. The more readers engage with your novel, the more you earn!',
      keywords: 'earnings money monetize revenue ads',
    },
    {
      id: '12',
      category: 'earnings',
      question: 'What is Stellar (XLM)? Why cryptocurrency?',
      answer: 'Stellar (XLM) is a cryptocurrency that enables fast, low-cost international payments. We use Stellar to pay authors because it\'s instant, has minimal fees, and works globally—perfect for our international community of writers.',
      keywords: 'stellar xlm cryptocurrency crypto',
    },
    {
      id: '13',
      category: 'earnings',
      question: 'How are earnings calculated?',
      answer: 'Earnings are based on ad views on your novel. Each ad view generates revenue that\'s credited to your account in Stellar (XLM). You can track your ad views and earnings in real-time on your Author Dashboard.',
      keywords: 'payment calculate distribution how much',
    },
    {
      id: '14',
      category: 'earnings',
      question: 'How do I withdraw my Stellar (XLM) earnings?',
      answer: 'Go to Wallet → Withdraw. You\'ll need a Stellar wallet address to receive payments. You can create a free Stellar wallet using services like Lobstr, Solar Wallet, or any Stellar-compatible wallet. Enter your wallet address and withdraw your XLM instantly.',
      keywords: 'withdraw payout cash stellar xlm',
    },
    {
      id: '15',
      category: 'earnings',
      question: 'Is there a minimum withdrawal amount?',
      answer: 'Yes, the minimum withdrawal is 10 XLM to cover network fees. Once you reach this threshold, you can withdraw anytime. There are no withdrawal limits or fees charged by Mantra.',
      keywords: 'minimum withdraw threshold amount',
    },
    {
      id: '16',
      category: 'earnings',
      question: 'How do I set up a Stellar wallet?',
      answer: 'Download a Stellar wallet app like Lobstr or Solar Wallet from your app store. Create an account and securely save your recovery phrase. Once set up, copy your Stellar address (starts with \'G\') and add it to your Mantra wallet settings.',
      keywords: 'wallet stellar xlm setup create',
    },
    {
      id: '17',
      category: 'earnings',
      question: 'Can I convert Stellar (XLM) to regular money?',
      answer: 'Yes! You can convert XLM to your local currency using cryptocurrency exchanges like Binance, Coinbase, or Kraken. Transfer your XLM from your Stellar wallet to the exchange, sell it, and withdraw to your bank account.',
      keywords: 'convert stellar xlm cash fiat money',
    },
    {
      id: '18',
      category: 'earnings',
      question: 'Is reading completely free?',
      answer: 'Yes! All novels on Mantra are 100% free to read. There are no premium chapters, coins, or subscriptions. Readers only watch ads, and that\'s how we support our authors. Everyone wins!',
      keywords: 'free reading cost pay',
    },
    // Technical Category
    {
      id: '19',
      category: 'technical',
      question: 'The app keeps crashing. What should I do?',
      answer: 'Try these steps: 1) Force close and restart the app 2) Clear app cache in Settings 3) Update to the latest version 4) Restart your device 5) Reinstall the app. If issues persist, contact support with your device model and OS version.',
      keywords: 'app crash freeze bug error',
    },
    {
      id: '20',
      category: 'technical',
      question: 'Why is the app loading slowly?',
      answer: 'Slow loading can be due to poor internet connection, server issues, or too much cached data. Check your connection, clear the app cache in Settings, or try switching between WiFi and mobile data.',
      keywords: 'loading slow performance speed',
    },
    {
      id: '21',
      category: 'technical',
      question: 'Will my data sync across devices?',
      answer: 'Yes! Your library, reading progress, bookmarks, and preferences automatically sync across all devices when you\'re logged in with the same account.',
      keywords: 'sync data backup restore',
    },
    {
      id: '22',
      category: 'technical',
      question: 'I\'m not receiving notifications. Why?',
      answer: 'Check: 1) Notifications are enabled in-app (Settings → Preferences) 2) App has notification permissions in your device settings 3) Battery saver isn\'t blocking notifications. Re-enable if needed.',
      keywords: 'notification not working push',
    },
  ];

  const filteredFaqs = faqData.filter((faq) => {
    const matchesCategory = activeCategory === 'all' || faq.category === activeCategory;
    const matchesSearch =
      searchQuery === '' ||
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.keywords.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleFaq = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Feather name="arrow-left" size={20} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Frequently Asked Questions</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Feather name="search" size={16} color={theme.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { backgroundColor: theme.inputBackground, borderColor: theme.border, color: theme.text }]}
            placeholder="Search FAQs..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={theme.textSecondary}
          />
        </View>

        {/* Category Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesContainer}
          contentContainerStyle={styles.categoriesContent}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryButton,
                { borderColor: theme.border, backgroundColor: theme.card },
                activeCategory === category.id && { backgroundColor: theme.primary, borderColor: theme.primary },
              ]}
              onPress={() => setActiveCategory(category.id)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.categoryButtonText,
                  { color: theme.textSecondary },
                  activeCategory === category.id && { color: colors.white },
                ]}
              >
                {category.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* FAQ Items */}
        <View style={styles.faqContainer}>
          {filteredFaqs.length > 0 ? (
            filteredFaqs.map((faq) => (
              <TouchableOpacity
                key={faq.id}
                style={[styles.faqItem, { backgroundColor: theme.card, borderColor: theme.border }]}
                onPress={() => toggleFaq(faq.id)}
                activeOpacity={0.7}
              >
                <View style={styles.faqHeader}>
                  <Text style={[styles.faqQuestion, { color: theme.text }]}>{faq.question}</Text>
                  <Feather
                    name="chevron-down"
                    size={16}
                    color={theme.textSecondary}
                    style={[
                      styles.chevronIcon,
                      expandedId === faq.id && styles.chevronIconRotated,
                    ]}
                  />
                </View>
                {expandedId === faq.id && (
                  <Text style={[styles.faqAnswer, { color: theme.textSecondary }]}>{faq.answer}</Text>
                )}
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.noResults}>
              <Feather name="search" size={48} color={theme.border} />
              <Text style={[styles.noResultsTitle, { color: theme.textSecondary }]}>No results found</Text>
              <Text style={[styles.noResultsText, { color: theme.textSecondary }]}>
                Try different keywords or browse all FAQs
              </Text>
            </View>
          )}
        </View>

        {/* Still Need Help */}
        <View style={[styles.helpCard, { backgroundColor: isDarkMode ? 'rgba(14, 165, 233, 0.1)' : colors.sky50, borderColor: isDarkMode ? 'rgba(14, 165, 233, 0.3)' : colors.sky100 }]}>
          <View style={[styles.helpIconContainer, { backgroundColor: isDarkMode ? 'rgba(14, 165, 233, 0.2)' : colors.white }]}>
            <Feather name="help-circle" size={16} color={colors.sky600} />
          </View>
          <View style={styles.helpContent}>
            <Text style={[styles.helpTitle, { color: theme.text }]}>Still need help?</Text>
            <Text style={[styles.helpText, { color: theme.textSecondary }]}>
              Can't find what you're looking for? Our support team is here to help.
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('ContactUs')}
              activeOpacity={0.7}
            >
              <Text style={styles.helpLink}>Contact Support →</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.slate100,
  },
  backButton: {
    padding: spacing[2],
    marginLeft: -spacing[2],
    borderRadius: borderRadius.lg,
  },
  headerTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.slate900,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
    paddingBottom: spacing[24],
  },
  searchContainer: {
    position: 'relative',
    marginBottom: spacing[4],
  },
  searchIcon: {
    position: 'absolute',
    left: spacing[3],
    top: '50%',
    transform: [{ translateY: -8 }],
    zIndex: 1,
  },
  searchInput: {
    width: '100%',
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.slate200,
    paddingLeft: spacing[9],
    paddingRight: spacing[3],
    height: 40, // Fixed height
    paddingVertical: 0, // Remove default padding
    fontSize: typography.fontSize.sm,
    color: colors.slate900,
    backgroundColor: colors.white,
  },
  categoriesContainer: {
    marginBottom: spacing[4],
  },
  categoriesContent: {
    gap: spacing[2],
  },
  categoryButton: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1.5],
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.slate200,
    backgroundColor: colors.white,
  },
  categoryButtonActive: {
    backgroundColor: colors.sky500,
    borderColor: colors.sky500,
  },
  categoryButtonText: {
    fontSize: typography.fontSize.xs,
    color: colors.slate700,
  },
  categoryButtonTextActive: {
    color: colors.white,
    fontWeight: typography.fontWeight.semibold,
  },
  faqContainer: {
    gap: spacing[2],
  },
  faqItem: {
    padding: spacing[3],
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.slate100,
    backgroundColor: colors.white,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  faqQuestion: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.slate900,
    paddingRight: spacing[2],
  },
  chevronIcon: {
    transform: [{ rotate: '0deg' }],
  },
  chevronIconRotated: {
    transform: [{ rotate: '180deg' }],
  },
  faqAnswer: {
    marginTop: spacing[2],
    fontSize: typography.fontSize.xs,
    color: colors.slate600,
    lineHeight: 18,
  },
  noResults: {
    alignItems: 'center',
    paddingVertical: spacing[8],
  },
  noResultsTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.slate700,
    marginTop: spacing[2],
  },
  noResultsText: {
    fontSize: typography.fontSize.xs,
    color: colors.slate500,
    marginTop: spacing[1],
  },
  helpCard: {
    marginTop: spacing[6],
    padding: spacing[4],
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.slate100,
    backgroundColor: colors.sky50,
    flexDirection: 'row',
    gap: spacing[3],
  },
  helpIconContainer: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpContent: {
    flex: 1,
  },
  helpTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.slate900,
  },
  helpText: {
    fontSize: typography.fontSize.xs,
    color: colors.slate600,
    marginTop: spacing[1],
    lineHeight: 18,
  },
  helpLink: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.sky600,
    marginTop: spacing[2],
  },
});

export default FaqScreen;

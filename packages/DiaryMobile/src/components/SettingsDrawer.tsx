import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Modal, Animated, Pressable, TouchableOpacity, StyleSheet } from 'react-native';
import { useLang } from '../LangContext';
import { APP_VERSION } from '../config';

export function SettingsDrawer({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { t, lang, setLang } = useLang();
  const slideAnim = useRef(new Animated.Value(280)).current;
  const [modalVisible, setModalVisible] = useState(visible);

  useEffect(() => {
    if (visible) {
      setModalVisible(true);
      Animated.timing(slideAnim, { toValue: 0, duration: 220, useNativeDriver: true }).start();
    } else {
      Animated.timing(slideAnim, { toValue: 280, duration: 180, useNativeDriver: true }).start(
        ({ finished }) => { if (finished) setModalVisible(false); }
      );
    }
  }, [visible, slideAnim]);

  return (
    <Modal visible={modalVisible} transparent animationType="none" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Animated.View style={[styles.panel, { transform: [{ translateX: slideAnim }] }]}>
          <Pressable style={{ flex: 1, flexDirection: 'column' }} onPress={() => {}}>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>{t.settings}</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
                <Text style={styles.closeText}>×</Text>
              </TouchableOpacity>
            </View>

            <View style={{ flex: 1 }}>
              <View style={styles.menuItem}>
                <Text style={styles.menuLabel}>{t.version}</Text>
                <Text style={styles.menuValue}>v{APP_VERSION}</Text>
              </View>
            </View>

            {/* Language selector — bottom, centered, padding-bottom 10px */}
            <View style={styles.langRow}>
              {(['zh', 'en', 'fr'] as const).map((l) => (
                <TouchableOpacity
                  key={l}
                  onPress={() => setLang(l)}
                  style={[styles.langBtn, lang === l && styles.langBtnActive]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.langBtnText, lang === l && styles.langBtnTextActive]}>
                    {l === 'zh' ? '中文' : l === 'en' ? 'English' : 'Français'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', flexDirection: 'row', justifyContent: 'flex-end' },
  panel: { width: 280, height: '100%', backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: -4, height: 0 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: '#4CAF50' },
  headerTitle: { fontSize: 17, fontWeight: 'bold', color: '#fff' },
  closeBtn: { padding: 4 },
  closeText: { fontSize: 22, color: '#fff', lineHeight: 26 },
  menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  menuLabel: { fontSize: 15, color: '#333' },
  menuValue: { fontSize: 13, color: '#888' },
  langRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 10, gap: 6 },
  langBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, backgroundColor: '#f5f5f5', borderWidth: 1, borderColor: '#e0e0e0', alignItems: 'center' },
  langBtnActive: { backgroundColor: '#4CAF50', borderColor: '#4CAF50' },
  langBtnText: { fontSize: 12, color: '#555' },
  langBtnTextActive: { color: '#fff', fontWeight: 'bold' },
});

import { View } from 'react-native'
import { WebView } from 'react-native-webview'
import { cameraHtml, type CameraKind } from './cameraHtml'

export function CameraPlayer({ kind, url, height = 240 }: { kind: CameraKind; url: string; height?: number }) {
  return (
    <View style={{ height, backgroundColor: '#000', borderRadius: 12, overflow: 'hidden' }}>
      <WebView
        originWhitelist={['*']}
        source={kind === 'web' ? { uri: url } : { html: cameraHtml(kind, url), baseUrl: '' }}
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        mixedContentMode="always"
        style={{ backgroundColor: '#000' }}
      />
    </View>
  )
}

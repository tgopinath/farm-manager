import { createElement } from 'react'
import { View } from 'react-native'
import { cameraHtml, type CameraKind } from './cameraHtml'

/** react-native-webview has no web build, so the browser gets a plain iframe. */
export function CameraPlayer({ kind, url, height = 240 }: { kind: CameraKind; url: string; height?: number }) {
  return (
    <View style={{ height, backgroundColor: '#000', borderRadius: 12, overflow: 'hidden' }}>
      {createElement('iframe', {
        title: 'Camera',
        style: { border: 0, width: '100%', height: '100%' },
        allow: 'autoplay; fullscreen',
        ...(kind === 'web' ? { src: url } : { srcDoc: cameraHtml(kind, url) }),
      })}
    </View>
  )
}

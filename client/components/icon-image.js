import React from 'react'
import {Image} from 'react-konva'
import useImage from 'use-image'

const url = '/images/unamusedMonster_green.png'

export default function IconImage() {
  const [image] = useImage(url)
  return <Image image={image} />
}

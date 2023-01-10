import downsample from '@seanvelasco/lttb'

// Philips ECG needs reconstitution
// Channels depend on the shape of other channels

const reconstituteData = (channels: { [key: string]: number[] }) => {

    let { I, II, III, AVR, AVL, AVF, V1, V2, V3, V4, V5, V6 } = channels

    // Lead III
    for (let i = 0; i < III.length; i++) {
        III[i] = II[i] - I[i] - III[i]
    }

    // Lead aVR
    for (let i = 0; i < AVR.length; i++) {
        AVR[i] = -AVR[i] - ((I[i] + II[i]) / 2)
    }

    // Lead aVL
    for (let i = 0; i < AVL.length; i++) {
        AVL[i] = (I[i] + III[i]) / 2 - AVL[i]
    }

    // Lead aVF
    for (let i = 0; i < AVF.length; i++) {
        AVF[i] = (II[i] + III[i]) / 2 - AVF[i]
    }
}


// Magic numbers for when ECG does not contain calibration data
// Introduce a minimum and maximum amplitude for each channel
// Derive the min and max from the document's set amplitude

// const calibrateDate = (channels: any) => {

//     // in every channel, find the first value that is not 0

//     for (const channel in channels) {
//         channels[channel].unshift(-baseline, baseline)
//     }
// }

// Group leads into their arrangement on the chart
// Data structure designed on what would be easier to manipulate/plot using D3

// For example, a 12-lead 3x4 chart will take up the form:
// I aVR V1 V4 (Group 1)
// II aVL V2 V5 (Group 2)
// III aVL V2 V5 (Group 3)
// II (Group 4)

// Concatenating multiple channels into a group is easier to Plot
// rather than plotting truncated channels

// 4 waveforms are plotted instead of all 12

// Note: Min and max are different for different channels; make sure to normalize first
// If this is not taken into account, some parts of the wave will appear smaller and some bigger

const groupData = (channels: any) => {
    let { I, II, III, AVR, AVL, AVF, V1, V2, V3, V4, V5, V6 } = channels

    const group1 = [
        ...I.slice(0, I.length / 4),
        ...AVR.slice(AVR.length / 4, (AVR.length / 4) * 2),
        ...V1.slice((V1.length / 4) * 2, (V1.length / 4) * 3),
        ...V4.slice((V4.length / 4) * 3, (V4.length / 4) * 4)
    ]

    const group2 = [
        ...II.slice(0, II.length / 4),
        ...AVL.slice(II.length / 4, (II.length / 4) * 2),
        ...V2.slice((II.length / 4) * 2, (II.length / 4) * 3),
        ...V5.slice((II.length / 4) * 3, (II.length / 4) * 4)
    ]

    const group3 = [
        ...III.slice(0, III.length / 4),
        ...AVF.slice(III.length / 4, (III.length / 4) * 2),
        ...V3.slice((III.length / 4) * 2, (III.length / 4) * 3),
        ...V6.slice((III.length / 4) * 3, (III.length / 4) * 4)
    ]

    const group4 = [...II]

    return [group1.map((d, i) => [i, d]), group2.map((d, i) => [i, d]), group3.map((d, i) => [i, d]), group4.map((d, i) => [i, d])]

    // return [group1, group2, group3, group4]
}


const normalizeData = (newLeads: any) => {

    const normalizeTime = (sequence: number[]) => {
        // Normalize data points from 0 to duration (s)
        const ratio = Math.max(...sequence) / 10
        const normalized = sequence.map((value: number) => {
            return value / ratio
        })
        return normalized
    }

    const normalizeAmplitude = (sequence: number[]) => {
        const normalized: number[] = []

        // Normalize between -2 mV and 2mV

        for (const value in sequence) {
            normalized.push(
                (2 * (sequence[value] - Math.min(...sequence))) / (Math.max(...sequence) - Math.min(...sequence)) - 1
            )
        }
        // normalize between 
        return normalized
    }

    const waveform = newLeads.map((lead: number[]) => {
        // Time variable is just the index
        const waveformArray = lead.map((value: number, time: number) => {
            if (isNaN(value)) {
                return [time, 0]
            }
            return [time, value]
        })

        return waveformArray
    })

    const normalizedWaveform: [number, number][][] = waveform.map((channel: number[][]) => {
        const time = channel.map((value) => value[0])
        const amplitude = channel.map((value) => value[1])

        const normalizedTime = normalizeTime(time)
        const normalizedAmplitude = normalizeAmplitude(amplitude)

        const cm = 1 / 2.54
        const pixels = 96

        return normalizedTime.map((value: number, index: number) => {
            return [value * cm * pixels, normalizedAmplitude[index] * cm * pixels]
        })
    })

    return normalizedWaveform
}

export {
    reconstituteData,
    groupData,
    normalizeData
}
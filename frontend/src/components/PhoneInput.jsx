import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  PHONE_COUNTRIES,
  buildFullPhone,
  countryFlag,
  parsePhoneValue,
} from '../data/phoneCountries'
import styles from './PhoneInput.module.css'

export default function PhoneInput({ value, onChange, placeholder = 'Tu número de WhatsApp' }) {
  const parsed = parsePhoneValue(value)
  const [country, setCountry] = useState(parsed.country)
  const [local, setLocal] = useState(parsed.local)
  const [open, setOpen] = useState(false)
  const [dropdownStyle, setDropdownStyle] = useState(null)
  const rootRef = useRef(null)
  const dropdownRef = useRef(null)

  useEffect(() => {
    const parsedValue = parsePhoneValue(value)
    setCountry(parsedValue.country)
    setLocal(parsedValue.local)
  }, [value])

  useEffect(() => {
    if (!open || !rootRef.current) return undefined

    const updatePosition = () => {
      const rect = rootRef.current.getBoundingClientRect()
      setDropdownStyle({
        top: rect.bottom + 6,
        left: rect.left,
        width: rect.width,
      })
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [open])

  useEffect(() => {
    if (!open) return undefined

    const handleClickOutside = (e) => {
      if (
        (rootRef.current && rootRef.current.contains(e.target))
        || (dropdownRef.current && dropdownRef.current.contains(e.target))
      ) {
        return
      }
      setOpen(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const emitChange = (nextCountry, nextLocal) => {
    onChange(buildFullPhone(nextCountry, nextLocal))
  }

  const handleLocalChange = (e) => {
    const nextLocal = e.target.value.replace(/[^\d\s()-]/g, '')
    setLocal(nextLocal)
    emitChange(country, nextLocal)
  }

  const handleSelectCountry = (nextCountry) => {
    setCountry(nextCountry)
    setOpen(false)
    emitChange(nextCountry, local)
  }

  return (
    <div className={styles.wrap} ref={rootRef}>
      <div className={styles.field}>
        <button
          type="button"
          className={styles.countryBtn}
          onClick={() => setOpen((prev) => !prev)}
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-label={`País seleccionado: ${country.name}`}
        >
          <span className={styles.flag} aria-hidden="true">{countryFlag(country.iso)}</span>
          <span className={styles.dial}>+{country.dial}</span>
          <span className={styles.chevron} aria-hidden="true">▾</span>
        </button>

        <input
          className={styles.input}
          type="tel"
          inputMode="tel"
          placeholder={placeholder}
          value={local}
          onChange={handleLocalChange}
          autoComplete="tel-national"
        />
      </div>

      {open && dropdownStyle && createPortal(
        <ul
          ref={dropdownRef}
          className={styles.dropdown}
          style={dropdownStyle}
          role="listbox"
        >
          {PHONE_COUNTRIES.map((item) => (
            <li key={item.iso}>
              <button
                type="button"
                role="option"
                aria-selected={item.iso === country.iso}
                className={`${styles.option} ${item.iso === country.iso ? styles.optionActive : ''}`}
                onClick={() => handleSelectCountry(item)}
              >
                <span className={styles.optionFlag} aria-hidden="true">{countryFlag(item.iso)}</span>
                <span className={styles.optionName}>{item.name}</span>
                <span className={styles.optionDial}>+{item.dial}</span>
              </button>
            </li>
          ))}
        </ul>,
        document.body,
      )}
    </div>
  )
}

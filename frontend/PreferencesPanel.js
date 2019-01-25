/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */
'use strict';

const PropTypes = require('prop-types');
const React = require('react');

const decorate = require('./decorate');
const {sansSerif} = require('./Themes/Fonts');
const {CUSTOM_THEME_NAME} = require('./Themes/constants');
const Icons = require('./Icons');
const SvgIcon = require('./SvgIcon');
const ThemeEditor = require('./Themes/Editor/Editor');
const Hoverable = require('./Hoverable');
const TraceUpdatesFrontendControl = require('../plugins/TraceUpdates/TraceUpdatesFrontendControl');
const ColorizerFrontendControl = require('../plugins/Colorizer/ColorizerFrontendControl');

import type {Theme} from './types';
import type {HiddenType} from '../backend/types';

type Props = {
  changeTheme: (themeName: string) => void,
  hasCustomTheme: boolean,
  hiddenTypes: Set<HiddenType>,
  hide: () => void,
  open: bool,
  toggleHiddenType: (hiddenType: HiddenType) => void,
};

type State = {
  editMode: bool,
};

class PreferencesPanel extends React.Component<Props, State> {
  _selectRef: any;

  context: {
    browserName: string,
    showHiddenThemes: boolean,
    theme: Theme,
    themeName: string,
    themes: { [key: string]: Theme },
  };

  constructor(props, context) {
    super(props, context);

    this.state = {
      editMode: false,
    };
  }

  componentDidMount(prevProps, prevState) {
    if (this.props.open) {
      this._selectRef.focus();
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.props.open && !prevProps.open) {
      this._selectRef.focus();
    }
  }

  render() {
    const {browserName, showHiddenThemes, theme, themeName, themes} = this.context;
    const {hasCustomTheme, hide, hiddenTypes, open} = this.props;
    const {editMode} = this.state;

    if (!open) {
      return null;
    }

    let content;
    if (editMode) {
      content = (
        <ThemeEditor hide={this._hide} theme={theme} />
      );
    } else {
      let themeNames = Object.keys(themes);
      if (!showHiddenThemes) {
        themeNames = themeNames.filter(key => !themes[key].hidden);
      }

      content = (
        <div style={panelStyle(theme)} onClick={blockClick}>
          <h4 style={styles.header}>Preferences</h4>
          <div style={styles.preferencesSection}>
            <TraceUpdatesFrontendControl />
            <ColorizerFrontendControl />
          </div>
          <h4 style={styles.header}>Hide types</h4>
          <div style={styles.preferencesSection}>
            <label>
              <input type="checkbox" checked={hiddenTypes.has('ContextConsumer')} onChange={() => this._toggleHiddenType('ContextConsumer')} />
              Context consumers
            </label>
            <label>
              <input type="checkbox" checked={hiddenTypes.has('ContextProvider')} onChange={() => this._toggleHiddenType('ContextProvider')} />
              Context providers
            </label>
            <label>
              <input type="checkbox" checked={hiddenTypes.has('ForwardRef')} onChange={() => this._toggleHiddenType('ForwardRef')} />
              ForwardRefs
            </label>
            <label>
              <input type="checkbox" checked={hiddenTypes.has('Fragment')} onChange={() => this._toggleHiddenType('Fragment')} />
              Fragments
            </label>
            <label>
              <input type="checkbox" checked={hiddenTypes.has('HOC')} onChange={() => this._toggleHiddenType('HOC')} />
              HOCs
            </label>
            <label>
              <input type="checkbox" checked={hiddenTypes.has('Mode')} onChange={() => this._toggleHiddenType('Mode')} />
              Modes
            </label>
            <label>
              <input type="checkbox" checked={hiddenTypes.has('Native')} onChange={() => this._toggleHiddenType('Native')} />
              Native elements
            </label>
            <label>
              <input type="checkbox" checked={hiddenTypes.has('Profiler')} onChange={() => this._toggleHiddenType('Profiler')} />
              Profiler
            </label>
          </div>
          <h4 style={styles.header}>Theme</h4>
          <div style={styles.preferencesSection}>
            <select
              onChange={this._changeTheme}
              onKeyUp={this._onKeyUp}
              ref={this._setSelectRef}
              value={themeName}
            >
              {browserName && (<option value="">{browserName}</option>)}
              {hasCustomTheme && (<option value={CUSTOM_THEME_NAME}>Custom</option>)}
              {(browserName || hasCustomTheme) && <option disabled="disabled">---</option>}
              {themeNames.map(key => (
                <option key={key} value={key}>{themes[key].displayName}</option>
              ))}
            </select>
            <EditButton
              onClick={this._onEditCustomThemeClick}
              theme={theme}
            >
              <EditIcon />
            </EditButton>
          </div>
          <div style={styles.buttonBar}>
            <button
              onClick={hide}
              style={styles.button}
            >
              Close
            </button>
          </div>
        </div>
      );
    }

    return (
      <div style={styles.backdrop} onClick={this._hide}>
        {content}
      </div>
    );
  }

  _toggleHiddenType = (hiddenType: HiddenType) => {
    const {toggleHiddenType} = this.props;

    toggleHiddenType(hiddenType);
  };

  _changeTheme = (event) => {
    const {changeTheme} = this.props;

    changeTheme(event.target.value);
  };

  _hide = () => {
    const {hide} = this.props;
    const {editMode} = this.state;

    if (editMode) {
      this.setState({
        editMode: false,
      });
    } else {
      hide();
    }
  };

  _onEditCustomThemeClick = () => {
    this.setState({
      editMode: true,
    });
  };

  _onKeyUp = ({ key }) => {
    if (key === 'Escape') {
      this.props.hide();
    }
  };

  _setSelectRef = (ref) => {
    this._selectRef = ref;
  };
}

PreferencesPanel.contextTypes = {
  browserName: PropTypes.string.isRequired,
  showHiddenThemes: PropTypes.bool.isRequired,
  theme: PropTypes.object.isRequired,
  themeName: PropTypes.string.isRequired,
  themes: PropTypes.object.isRequired,
};
PreferencesPanel.propTypes = {
  changeTheme: PropTypes.func,
  hide: PropTypes.func,
  open: PropTypes.bool,
};


const EditButton = Hoverable(
  ({ isHovered, onClick, onMouseEnter, onMouseLeave, theme }) => (
    <button
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={buttonStyle(isHovered, theme)}
    >
      <EditIcon/>
    </button>
  )
);

const EditIcon = () => (
  <SvgIcon path={Icons.EDIT} />
);

const blockClick = event => event.stopPropagation();

const WrappedPreferencesPanel = decorate({
  listeners() {
    return ['hiddenTypes', 'preferencesPanelShown'];
  },
  props(store, props) {
    return {
      changeTheme: themeName => store.changeTheme(themeName),
      hiddenTypes: store.hiddenTypes,
      hasCustomTheme: !!store.themeStore.customTheme,
      hide: () => store.hidePreferencesPanel(),
      open: store.preferencesPanelShown,
      toggleHiddenType: hiddenType => store.toggleHiddenType(hiddenType),
    };
  },
}, PreferencesPanel);

const panelStyle = (theme: Theme) => ({
  maxWidth: '100%',
  margin: '0.5rem',
  padding: '0.5rem',
  borderRadius: '0.25rem',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  zIndex: 1,
  fontFamily: sansSerif.family,
  fontSize: sansSerif.sizes.normal,
  backgroundColor: theme.base01,
  border: `1px solid ${theme.base03}`,
  color: theme.base05,
});

const buttonStyle = (isHovered: boolean, theme: Theme) => ({
  padding: '0.25rem',
  marginLeft: '0.25rem',
  height: '1.5rem',
  background: 'none',
  border: 'none',
  color: isHovered ? theme.state06 : 'inherit',
});

const styles = {
  backdrop: {
    position: 'fixed',
    zIndex: 1,
    width: '100%',
    height: '100%',
    top: 0,
    left: 0,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0)',
  },
  header: {
    margin: '0 0 0.5rem',
    fontSize: sansSerif.sizes.large,
  },
  buttonBar: {
    flexDirection: 'row',
  },
  button: {
    padding: '0.25rem',
  },
  preferencesSection: {
    display: 'grid',
    gridTemplateColumns: 'auto auto auto',
    gridColumnGap: '5px',
    gridRowGap: '5px',
    margin: '0 0 0.5rem',
  },
};

module.exports = WrappedPreferencesPanel;

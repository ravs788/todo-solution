import React, { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import axios from "axios";
import "./TagInput.css";

const TagInput = ({ value, onChange, apiBase }) => {
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    async function fetchSuggestions() {
      if (inputValue.trim().length === 0) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }
      setLoading(true);
      try {
        const response = await axios.get(`${apiBase}/api/tags?search=${encodeURIComponent(inputValue.trim())}`);
        if (response && response.data) {
          setSuggestions(response.data.filter(tag => !value.includes(tag)));
          setShowSuggestions(true);
        } else {
          setSuggestions([]);
        }
      } catch (error) {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }
    fetchSuggestions();
  }, [inputValue, apiBase, value]);

  // Keyboard and outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const addTag = (tag) => {
    if (
      !tag ||
      value.includes(tag) ||
      tag.length === 0 ||
      tag.length > 32
    ) {
      return;
    }
    onChange([...value, tag]);
    setInputValue("");
    setShowSuggestions(false);
  };

  const removeTag = (tagToRemove) => {
    onChange(value.filter((tag) => tag !== tagToRemove));
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && inputValue.trim()) {
      addTag(inputValue.trim());
      e.preventDefault();
    } else if (e.key === "Backspace" && inputValue === "" && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  const handleSuggestionClick = (tag) => {
    addTag(tag);
    setInputValue("");
  };

  return (
    <div ref={containerRef} className="taginput-container">
      <div className="taginput-tag-list">
        {value.map((tag) => (
          <span
            key={tag}
            className="taginput-tag"
          >
            {tag}
            <span
              className="taginput-remove"
              onClick={() => removeTag(tag)}
              aria-label={`Remove ${tag}`}
              tabIndex={0}
            >
              ×
            </span>
          </span>
        ))}
        <input
          className="taginput-input"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Type tag and press Enter"
          aria-label="Tag input"
        />
      </div>
      {showSuggestions && suggestions.length > 0 && (
        <div className="taginput-suggestions">
          {loading && <div className="taginput-loading">Loading...</div>}
          {/* Option to create a new tag if it doesn't exist in suggestions */}
          {!loading &&
            inputValue.trim().length > 0 &&
            !suggestions.includes(inputValue.trim()) &&
            !value.includes(inputValue.trim()) && (
              <div
                key="create-new"
                tabIndex={0}
                role="button"
                onClick={() => handleSuggestionClick(inputValue.trim())}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSuggestionClick(inputValue.trim());
                }}
                className="taginput-suggestion-item taginput-create-item"
              >
                Create “{inputValue.trim()}”
              </div>
            )}
          {suggestions.map((tag) => (
            <div
              key={tag}
              tabIndex={0}
              role="button"
              onClick={() => handleSuggestionClick(tag)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSuggestionClick(tag);
              }}
              className="taginput-suggestion-item"
            >
              {tag}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

TagInput.propTypes = {
  value: PropTypes.array.isRequired,
  onChange: PropTypes.func.isRequired,
  apiBase: PropTypes.string.isRequired
};

export default TagInput;

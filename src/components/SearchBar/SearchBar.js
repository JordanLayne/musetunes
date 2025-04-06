import React, { useState, useCallback } from "react";
import "./SearchBar.css";

const SearchBar = (props) => {
  const [term, setTerm] = useState("");

  const handleTermChange = useCallback((event) => {
    setTerm(event.target.value);
  }, []);

  const search = useCallback(() => {
    props.onSearch(term);
  }, [props.onSearch, term]);

  const handleKeyPress = useCallback((event) => {
    if (event.key === 'Enter') {
      search();
    }
  }, [search]);

  return (
    <div className="SearchBar">
      <input 
        placeholder="Enter A Song Title" 
        onChange={handleTermChange} 
        onKeyPress={handleKeyPress}
      />
      <button className="SearchButton" onClick={search}>
        SEARCH
      </button>
    </div>
  );
};

export default SearchBar;
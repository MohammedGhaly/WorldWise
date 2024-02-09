import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useState,
} from "react";

const URL = "http://localhost:9000/";
const initializeState = {
  cities: [],
  isLoading: false,
  currentCity: {},
  error: "",
};

const CitiesContext = createContext();

function reducer(state, action) {
  switch (action.type) {
    case "rejected":
      return { ...state, error: action.payload, isLoading: false };
    case "loading":
      return { ...state, isLoading: true };
    case "city/loaded":
      return { ...state, isLoading: false, currentCity: action.payload };
    case "cities/loaded":
      return { ...state, isLoading: false, cities: action.payload };
    case "city/created":
      return {
        ...state,
        isLoading: false,
        cities: [...state.cities, action.payload],
        currentCity: action.payload,
      };
    case "cities/deleted":
      return {
        ...state,
        isLoading: false,
        cities: state.cities.filter((city) => city.id !== action.payload),
        currentCity: {},
      };
    default:
      throw new Error("unknown action type");
  }
}

function CitiesProvider({ children }) {
  const [{ cities, isLoading, currentCity, error }, dispatch] = useReducer(
    reducer,
    initializeState
  );

  useEffect(function () {
    async function fetchCities() {
      dispatch({ type: "loading" });
      try {
        const res = await fetch(`${URL}cities`);
        const data = await res.json();
        dispatch({ type: "cities/loaded", payload: data });
      } catch (e) {
        dispatch({
          type: "rejected",
          payload: "error happened during fetching cities",
        });
      }
    }
    fetchCities();
  }, []);

  async function getCity(id) {
    if (id === currentCity.id) return;

    dispatch({ type: "loading" });
    try {
      const res = await fetch(`${URL}cities/${id}`);
      const data = await res.json();
      dispatch({ type: "city/loaded", payload: data });
    } catch (e) {
      dispatch({
        type: "rejected",
        payload: "error happened during fetching city",
      });
    }
  }

  async function createCity(newCity) {
    dispatch({ type: "loading" });
    try {
      const res = await fetch(`${URL}cities`, {
        method: "POST",
        body: JSON.stringify(newCity),
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await res.json();
      dispatch({ type: "city/created", payload: data });
    } catch (e) {
      dispatch({
        type: "rejected",
        payload: "error happened during creating city",
      });
    }
  }

  async function deleteCity(cityId) {
    dispatch({ type: "loading" });
    try {
      await fetch(`${URL}cities/${cityId}`, {
        method: "DELETE",
      });
      dispatch({ type: "city/deleted", payload: cityId });
    } catch (e) {
      dispatch({
        type: "rejected",
        payload: "error happened during deletting city",
      });
    }
  }

  return (
    <CitiesContext.Provider
      value={{
        cities,
        isLoading,
        currentCity,
        error,
        getCity,
        createCity,
        deleteCity,
      }}
    >
      {children}
    </CitiesContext.Provider>
  );
}

function useCities() {
  const context = useContext(CitiesContext);
  if (context === undefined)
    throw new Error("'CitiesContext' is used outside the 'CitiesProvider'");
  return context;
}

export { CitiesProvider, useCities };

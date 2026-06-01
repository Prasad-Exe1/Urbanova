import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Upload, Sparkles } from 'lucide-react';
import Toast from '../components/Toast';

function AddListing() {
  const navigate = useNavigate();
  const location = useLocation();

  const editingProperty = location.state?.property || null;
  const isEditMode = !!editingProperty;

  const [formData, setFormData] = useState({
    title: editingProperty?.title || '',
    description: editingProperty?.description || '',
    price: editingProperty?.price || '',
    location: editingProperty?.location || '',
    pincode: editingProperty?.pincode || '',
  });

  const [file, setFile] = useState(null);
  const [imageURL, setImageURL] = useState(editingProperty?.image || '');
  const [toast, setToast] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [currentSuggestionIndex, setCurrentSuggestionIndex] = useState(-1);

  const handleAI = async () => {
    if (aiSuggestions.length > 0) {
      const nextIndex = (currentSuggestionIndex + 1) % aiSuggestions.length;
      setCurrentSuggestionIndex(nextIndex);
      setFormData((prev) => ({ ...prev, description: aiSuggestions[nextIndex] }));
      return;
    }

    try {
      const res = await fetch('/api/properties/generate-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: formData.title, location: formData.location, price: formData.price }),
      });
      const data = await res.json();

      if (data.descriptions && data.descriptions.length > 0) {
        setAiSuggestions(data.descriptions);
        setCurrentSuggestionIndex(0);
        setFormData((prev) => ({ ...prev, description: data.descriptions[0] }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append('title', formData.title);
    data.append('description', formData.description);
    data.append('price', formData.price);
    data.append('location', formData.location);
    data.append('pincode', formData.pincode || '');

    if (file) {
      data.append('image', file);
    } else if (imageURL) {
      data.append('image', imageURL);
    }

    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user._id) {
      data.append('user', user._id);
    }

    try {
      const apiUrl = isEditMode ? `/api/properties/${editingProperty._id}` : '/api/properties';
      const method = isEditMode ? 'PUT' : 'POST';

      const res = await fetch(apiUrl, {
        method,
        body: data,
      });
      if (res.ok) {
        navigate(isEditMode ? `/property/${editingProperty._id}` : '/');
      } else {
        setToast({ message: `Failed to ${isEditMode ? 'update' : 'publish'} listing.`, type: 'error' });
      }
    } catch (err) {
      console.error(err);
      setToast({ message: `Error ${isEditMode ? 'updating' : 'publishing'} listing.`, type: 'error' });
    }
  };

  const labelCls = 'block font-label-sm text-tertiary mb-xs uppercase tracking-wide';

  return (
    <main className="max-w-3xl mx-auto px-margin py-xl pb-24">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <p className="font-label-sm text-primary uppercase tracking-widest mb-sm">
        {isEditMode ? 'Edit listing' : 'Seller'}
      </p>
      <h1 className="font-display-xl text-[36px] md:text-display-xl text-on-background mb-lg m-0">
        {isEditMode ? 'Edit property' : 'List your property'}
      </h1>

      <form onSubmit={handleSubmit} className="glass-panel rounded-2xl border border-white/10 p-lg md:p-xl flex flex-col gap-lg">
        <div>
          <label htmlFor="title" className={labelCls}>
            Property title
          </label>
          <input
            id="title"
            name="title"
            placeholder="e.g. 3 BHK — Serilingampally near ORR"
            value={formData.title}
            onChange={handleChange}
            required
            className="w-full bg-surface-container-highest border border-outline-variant rounded-lg px-md py-sm text-on-background placeholder:text-on-surface-variant focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-body-md"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
          <div>
            <label htmlFor="price" className={labelCls}>
              Price (₹)
            </label>
            <input
              id="price"
              name="price"
              type="number"
              placeholder="10000000"
              value={formData.price}
              onChange={handleChange}
              required
              className="w-full bg-surface-container-highest border border-outline-variant rounded-lg px-md py-sm text-on-background focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-body-md"
            />
          </div>
          <div>
            <label htmlFor="location" className={labelCls}>
              Locality / address
            </label>
            <input
              id="location"
              name="location"
              placeholder="e.g. Road No 12 Banjara Hills, Hyderabad"
              value={formData.location}
              onChange={handleChange}
              required
              className="w-full bg-surface-container-highest border border-outline-variant rounded-lg px-md py-sm text-on-background focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-body-md"
            />
          </div>
        </div>

        <div>
          <label htmlFor="pincode" className={labelCls}>
            PIN code
          </label>
          <input
            id="pincode"
            name="pincode"
            placeholder="e.g. 500033"
            value={formData.pincode}
            onChange={handleChange}
            required
            className="w-full max-w-xs bg-surface-container-highest border border-outline-variant rounded-lg px-md py-sm text-on-background focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-body-md"
          />
        </div>

        <div>
          <span className={labelCls}>Image</span>
          <div className="flex flex-col gap-md">
            <div className="relative">
              <Upload size={18} className="absolute left-md top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
              <input
                type="text"
                placeholder="https://example.com/image.jpg (or upload below)"
                value={imageURL}
                onChange={(e) => setImageURL(e.target.value)}
                className="w-full bg-surface-container-highest border border-outline-variant rounded-lg py-sm pl-10 pr-md text-on-background placeholder:text-on-surface-variant focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-body-md"
              />
            </div>
            <div className="border border-dashed border-outline-variant rounded-lg p-md text-center bg-surface-container-low/50">
              <p className="font-body-md text-on-surface-variant mt-0 mb-sm">Or upload file (overrides URL)</p>
              <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0])} className="text-sm text-on-surface-variant w-full max-w-xs mx-auto" />
            </div>
          </div>
        </div>

        <div>
          <div className="flex flex-wrap justify-between items-center gap-sm mb-xs">
            <label htmlFor="description" className={`${labelCls} mb-0`}>
              Description
            </label>
            <button
              type="button"
              onClick={handleAI}
              className="inline-flex items-center gap-xs font-label-sm bg-primary/15 border border-primary/40 text-primary px-md py-xs rounded-lg hover:bg-primary/25 transition-colors"
            >
              <Sparkles size={14} /> AI generate
            </button>
          </div>
          <textarea
            id="description"
            name="description"
            placeholder="Describe the property..."
            rows={6}
            value={formData.description}
            onChange={handleChange}
            required
            className="w-full bg-surface-container-highest border border-outline-variant rounded-lg px-md py-sm text-on-background placeholder:text-on-surface-variant focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-body-md resize-y min-h-[140px]"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-primary text-on-primary font-label-sm py-md rounded-lg hover:bg-primary-fixed transition-colors"
        >
          {isEditMode ? 'Update listing' : 'Publish listing'}
        </button>
      </form>
    </main>
  );
}

export default AddListing;

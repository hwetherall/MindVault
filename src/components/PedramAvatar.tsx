import React from 'react';
import pedramImage from '../assets/pedram-avatar.jpg';

export const PedramAvatar: React.FC = () => {
    return (
        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-[#E20074] mb-4">
            <img 
                src={pedramImage}
                alt="Innovation Expert"
                className="w-full h-full object-cover"
            />
        </div>
    );
}; 
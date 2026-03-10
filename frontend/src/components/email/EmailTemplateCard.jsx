import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mail, Calendar, Building2, TrendingUp, Home, Users,
  Eye, Copy, Trash2, Edit, MoreVertical
} from 'lucide-react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';

const categoryConfig = {
  open_house: {
    label: 'Open House',
    icon: Calendar,
    color: 'bg-blue-500/10 text-blue-500 border-blue-500/20'
  },
  property_promo: {
    label: 'Promoción',
    icon: Building2,
    color: 'bg-purple-500/10 text-purple-500 border-purple-500/20'
  },
  follow_up: {
    label: 'Seguimiento',
    icon: Users,
    color: 'bg-green-500/10 text-green-500 border-green-500/20'
  },
  market_update: {
    label: 'Mercado',
    icon: TrendingUp,
    color: 'bg-amber-500/10 text-amber-500 border-amber-500/20'
  },
  buyer_nurturing: {
    label: 'Compradores',
    icon: Home,
    color: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20'
  },
  seller_nurturing: {
    label: 'Vendedores',
    icon: TrendingUp,
    color: 'bg-rose-500/10 text-rose-500 border-rose-500/20'
  },
  custom: {
    label: 'Personalizada',
    icon: Mail,
    color: 'bg-gray-500/10 text-gray-500 border-gray-500/20'
  }
};

export const EmailTemplateCard = ({ template, onDuplicate, onDelete, onPreview }) => {
  const navigate = useNavigate();
  const category = categoryConfig[template.category] || categoryConfig.custom;
  const CategoryIcon = category.icon;

  const handlePreview = (e) => {
    e.stopPropagation();
    if (onPreview) {
      onPreview(template);
    } else {
      navigate(`/email-templates/${template.id}?preview=true`);
    }
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    navigate(`/email-templates/${template.id}`);
  };

  const handleDuplicate = (e) => {
    e.stopPropagation();
    if (onDuplicate) onDuplicate(template);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (onDelete) onDelete(template);
  };

  // Generate thumbnail from HTML
  const getThumbnailStyle = () => {
    // Extract background color from HTML if possible
    const bgMatch = template.html_content?.match(/background-color:([#a-zA-Z0-9]+)/);
    const bgColor = bgMatch ? bgMatch[1] : '#f4f4f4';

    return {
      backgroundColor: bgColor,
    };
  };

  return (
    <Card
      className="group cursor-pointer hover:shadow-lg transition-all duration-200 overflow-hidden"
      onClick={handleEdit}
    >
      {/* Thumbnail Preview */}
      <div
        className="h-40 relative overflow-hidden border-b"
        style={getThumbnailStyle()}
      >
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <div className="w-full h-full bg-white rounded shadow-sm p-2 overflow-hidden">
            {template.thumbnail_url ? (
              <img
                src={template.thumbnail_url}
                alt={template.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs text-center p-2">
                <Mail className="w-6 h-6 mx-auto mb-1 opacity-30" />
                <p className="line-clamp-2">{template.subject || template.name}</p>
              </div>
            )}
          </div>
        </div>

        {/* Category Badge */}
        <div className="absolute top-2 left-2">
          <Badge className={`${category.color} text-xs`}>
            <CategoryIcon className="w-3 h-3 mr-1" />
            {category.label}
          </Badge>
        </div>

        {/* Actions */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-8 w-8 bg-background/80 backdrop-blur">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handlePreview}>
                <Eye className="w-4 h-4 mr-2" />
                Vista previa
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDuplicate}>
                <Copy className="w-4 h-4 mr-2" />
                Duplicar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                <Trash2 className="w-4 h-4 mr-2" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Content */}
      <CardContent className="p-4">
        <h3 className="font-semibold text-sm truncate mb-1">{template.name}</h3>
        <p className="text-xs text-muted-foreground truncate mb-3">{template.subject}</p>

        {/* Variables */}
        {template.variables && template.variables.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {template.variables.slice(0, 3).map((variable, idx) => (
              <Badge key={idx} variant="outline" className="text-[10px] px-1.5 py-0">
                {'{{' + variable + '}}'}
              </Badge>
            ))}
            {template.variables.length > 3 && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                +{template.variables.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {new Date(template.updated_at || template.created_at).toLocaleDateString('es-ES', {
              day: 'numeric',
              month: 'short'
            })}
          </span>
          {template.is_default && (
            <Badge variant="secondary" className="text-[10px]">Plantilla base</Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { SectorSpecificModalData } from "@/context/AppContext";
import { useApp } from "@/context/AppContext";

interface SectorSpecificModalProps {
  data: SectorSpecificModalData;
}

export function SectorSpecificModal({ data }: SectorSpecificModalProps) {
  const { setIsPopPaneOpen } = useApp();
  const form = useForm();

  const onSubmit = (formData: any) => {
    console.log('Form submitted:', formData);
    console.log('Modal type:', data.modalType);
    console.log('Sector:', data.sector, 'Subsector:', data.subsector);
    
    // Here you would typically save the data to your backend or state management
    // For now, we'll just close the modal and show success
    alert(`${data.modalType === 'sim-issue' ? 'Issue' : data.modalType === 'ci-project' ? 'Project' : 'Scenario'} created successfully!`);
    setIsPopPaneOpen(false);
  };

  const onCancel = () => {
    setIsPopPaneOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h4 className="text-lg font-semibold">{data.title}</h4>
        <p className="text-sm text-muted-foreground">
          {data.sector && data.subsector && `${data.sector} - ${data.subsector}`}
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {data.fields.map((field) => (
            <FormField
              key={field.name}
              control={form.control}
              name={field.name}
              rules={{ required: field.required ? `${field.label} is required` : false }}
              render={({ field: formField }) => (
                <FormItem>
                  <FormLabel>{field.label}</FormLabel>
                  <FormControl>
                    {field.type === 'text' && (
                      <Input
                        placeholder={field.placeholder}
                        {...formField}
                      />
                    )}
                    {field.type === 'number' && (
                      <Input
                        type="number"
                        placeholder={field.placeholder}
                        {...formField}
                      />
                    )}
                    {field.type === 'textarea' && (
                      <Textarea
                        placeholder={field.placeholder}
                        rows={3}
                        {...formField}
                      />
                    )}
                    {field.type === 'select' && (
                      <Select onValueChange={formField.onChange} defaultValue={formField.value}>
                        <SelectTrigger>
                          <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
                        </SelectTrigger>
                        <SelectContent>
                          {field.options?.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    {field.type === 'date' && (
                      <Input
                        type="date"
                        {...formField}
                      />
                    )}
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}

          <div className="flex items-center gap-3 pt-4">
            <Button type="submit" className="flex-1">
              Create {data.modalType === 'sim-issue' ? 'Issue' : data.modalType === 'ci-project' ? 'Project' : 'Scenario'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
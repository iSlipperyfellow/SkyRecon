declare module 'react-window' {
    import { Component, CSSProperties, ComponentType, Ref } from 'react';

    export type Align = 'auto' | 'smart' | 'center' | 'end' | 'start';
    export type ListOnItemsRenderedProps = {
        overscanStartIndex: number;
        overscanStopIndex: number;
        visibleStartIndex: number;
        visibleStopIndex: number;
    };
    export type ListOnScrollProps = {
        scrollDirection: 'forward' | 'backward';
        scrollOffset: number;
        scrollUpdateWasRequested: boolean;
    };

    export type FixedSizeListProps = {
        children: ComponentType<{ index: number; style: CSSProperties; data?: any }>;
        className?: string;
        direction?: 'vertical' | 'horizontal';
        height: number | string;
        initialScrollOffset?: number;
        innerRef?: Ref<any>;
        innerElementType?: string | ComponentType<any>;
        itemCount: number;
        itemData?: any;
        itemKey?: (index: number, data: any) => any;
        itemSize: number;
        layout?: 'vertical' | 'horizontal';
        onItemsRendered?: (props: ListOnItemsRenderedProps) => any;
        onScroll?: (props: ListOnScrollProps) => any;
        outerRef?: Ref<any>;
        outerElementType?: string | ComponentType<any>;
        overscanCount?: number;
        style?: CSSProperties;
        useIsScrolling?: boolean;
        width: number | string;
    };

    export class FixedSizeList extends Component<FixedSizeListProps> {
        scrollTo(scrollOffset: number): void;
        scrollToItem(index: number, align?: Align): void;
    }

    export class VariableSizeList extends Component<any> { }
}

import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CommonTestingModule } from 'src/testing/commontest.module';
import { ItemRendererComponent } from './item-renderer.component';

describe('ItemRendererComponent', () => {
  let component: ItemRendererComponent;
  let fixture: ComponentFixture<ItemRendererComponent>;
  CommonTestingModule.setUpTestBed(ItemRendererComponent);
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ItemRendererComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ItemRendererComponent);
    component = fixture.componentInstance;
    component.item = {
      type : 'Text',
      customProperties: {
        color: 'red'
      }
    }
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
